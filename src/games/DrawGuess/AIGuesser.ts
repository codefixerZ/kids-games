import * as tf from '@tensorflow/tfjs';

export interface Ml5Result {
  label: string;
  confidence: number;
}

const INPUT_SIZE = 28;
let CLASS_NAMES: string[] = [];

async function loadClassNames(): Promise<string[]> {
  const res = await fetch(import.meta.env.BASE_URL + 'models/doodlenet/class_names.txt');
  const text = await res.text();
  return text.trim().split('\n').map(s => s.trim());
}

// ─── Debug overlay ────────────────────────────────────────────────────────────
// Shows a 28×28 preview of what the model actually sees (bottom-right corner).
let debugOverlay: HTMLElement | null = null;

function showDebugOverlay(tensor: tf.Tensor3D, label: string, conf: number) {
  // Build the overlay once
  if (!debugOverlay) {
    debugOverlay = document.createElement('div');
    Object.assign(debugOverlay.style, {
      position:    'fixed',
      bottom:      '8px',
      right:       '8px',
      background:  'rgba(0,0,0,0.7)',
      padding:     '6px',
      borderRadius:'6px',
      zIndex:      '9999',
      color:       '#fff',
      fontSize:    '11px',
      fontFamily:  'monospace',
      lineHeight:  '1.4',
      textAlign:   'center',
      pointerEvents: 'none',
    });
    document.body.appendChild(debugOverlay);
  }

  const [h, w] = tensor.shape;
  const scale  = 5; // render each model pixel as 5×5 CSS pixels
  const c = document.createElement('canvas');
  c.width  = w * scale;
  c.height = h * scale;
  const ctx  = c.getContext('2d')!;
  const data = tensor.dataSync();

  // Build 1×1 image then scale up (pixelated look so you can count pixels)
  const tmp = document.createElement('canvas');
  tmp.width = w; tmp.height = h;
  const imgData = tmp.getContext('2d')!.createImageData(w, h);
  for (let i = 0; i < h * w; i++) {
    const v = Math.round(data[i] * 255);
    imgData.data[i * 4 + 0] = v;
    imgData.data[i * 4 + 1] = v;
    imgData.data[i * 4 + 2] = v;
    imgData.data[i * 4 + 3] = 255;
  }
  tmp.getContext('2d')!.putImageData(imgData, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, 0, 0, w * scale, h * scale);

  debugOverlay.innerHTML = '';
  debugOverlay.appendChild(c);
  const caption = document.createElement('div');
  caption.textContent = `${label} (${(conf * 100).toFixed(0)}%)`;
  debugOverlay.appendChild(caption);
}

// ─── Bounding-box crop ────────────────────────────────────────────────────────
// Crop the canvas to the tight bounding box of non-white pixels + padding,
// returning a square canvas ready for 28×28 downscaling.
// Returns { canvas, strokeCount } so callers can log whether strokes were found.
function cropToStrokesBoundingBox(
  canvas: HTMLCanvasElement,
  padding = 14,
): { canvas: HTMLCanvasElement; strokeCount: number } {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const pixels = ctx.getImageData(0, 0, width, height).data;

  let minX = width, minY = height, maxX = 0, maxY = 0;
  let strokeCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i   = (y * width + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      // Pixel is a stroke if it's noticeably non-white on ANY channel.
      // Threshold 240 (not 250) to catch anti-aliased stroke edges.
      if (r < 240 || g < 240 || b < 240) {
        strokeCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // No strokes found — return full canvas (fallback)
  if (strokeCount === 0 || maxX <= minX || maxY <= minY) {
    return { canvas, strokeCount: 0 };
  }

  // Add padding and clamp to canvas bounds
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width  - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  // Make it square by extending the shorter side
  const bw   = maxX - minX;
  const bh   = maxY - minY;
  const size = Math.max(bw, bh);
  const cx   = (minX + maxX) / 2;
  const cy   = (minY + maxY) / 2;
  const sx   = Math.max(0, Math.round(cx - size / 2));
  const sy   = Math.max(0, Math.round(cy - size / 2));
  const sw   = Math.min(width  - sx, size);
  const sh   = Math.min(height - sy, size);

  const out    = document.createElement('canvas');
  out.width    = sw;
  out.height   = sh;
  const outCtx = out.getContext('2d')!;
  outCtx.fillStyle = '#ffffff';
  outCtx.fillRect(0, 0, sw, sh);
  outCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);

  return { canvas: out, strokeCount };
}

// ─── Dilation (maxPool) ───────────────────────────────────────────────────────
// After downscaling to 28×28, thin strokes become sub-pixel. A 3×3 max-pool
// "grows" bright (stroke) pixels into their neighbours so the model sees them.
function dilate(tensor: tf.Tensor3D): tf.Tensor3D {
  // maxPool expects [batch, h, w, c]
  const b  = tensor.expandDims(0) as tf.Tensor4D;
  const d  = tf.maxPool(b, [3, 3], [1, 1], 'same') as tf.Tensor4D;
  const out = d.squeeze([0]) as tf.Tensor3D;
  b.dispose();
  d.dispose();
  return out;
}

export class AIGuesser {
  private model: tf.LayersModel | null = null;
  private ready = false;

  async load(): Promise<void> {
    await tf.ready();
    [this.model, CLASS_NAMES] = await Promise.all([
      tf.loadLayersModel(import.meta.env.BASE_URL + 'models/doodlenet/model.json'),
      loadClassNames(),
    ]);
    this.ready = true;
  }

  isReady(): boolean { return this.ready; }

  async classify(canvas: HTMLCanvasElement, topK = 10): Promise<Ml5Result[]> {
    if (!this.model) throw new Error('Model not loaded');

    // ── Step 1: crop to stroke bounding box ──────────────────────────────────
    const { canvas: cropped, strokeCount } = cropToStrokesBoundingBox(canvas);

    console.log(
      `[AIGuesser] Canvas ${canvas.width}×${canvas.height}  |` +
      ` strokePixels=${strokeCount}  |` +
      ` cropped=${cropped.width}×${cropped.height}`,
    );

    if (strokeCount === 0) {
      console.warn('[AIGuesser] ⚠️  No strokes detected — canvas looks blank! Is the brush color dark?');
    }

    // ── Step 2: normalise → grayscale → resize to 28×28 ──────────────────────
    const rgb     = tf.browser.fromPixels(cropped).toFloat().div(255);
    const gray    = rgb.mean(2, true) as tf.Tensor3D;
    const resized = tf.image.resizeBilinear(gray, [INPUT_SIZE, INPUT_SIZE]);

    // ── Step 3: invert (white bg → 0, dark strokes → 1) ──────────────────────
    // Quick Draw training data = white strokes on black background.
    // Our canvas = black strokes on white background → invert to match.
    const inverted = tf.scalar(1).sub(resized) as tf.Tensor3D;

    // ── Step 4: dilate — thickens sub-pixel strokes at 28×28 ─────────────────
    const dilated = dilate(inverted);

    // ── Step 5: predict ───────────────────────────────────────────────────────
    const batched      = dilated.expandDims(0);
    const outputTensor = this.model.predict(batched) as tf.Tensor;
    const probs        = await (outputTensor.squeeze() as tf.Tensor1D).array() as number[];

    // Clean up
    rgb.dispose(); gray.dispose(); resized.dispose();
    inverted.dispose(); batched.dispose(); outputTensor.dispose();

    // ── Step 6: sort results ──────────────────────────────────────────────────
    const indexed = probs.map((p, i) => ({ p, i }));
    indexed.sort((a, b) => b.p - a.p);
    const results = indexed.slice(0, topK).map(({ p, i }) => ({
      label:      CLASS_NAMES[i] ?? `class_${i}`,
      confidence: p,
    }));

    console.log(
      '[AIGuesser] Top-5:',
      results.slice(0, 5).map(r => `${r.label}(${(r.confidence * 100).toFixed(1)}%)`).join(', '),
    );

    // ── Step 7: debug overlay (bottom-right corner) ───────────────────────────
    // Shows the 28×28 tensor the model actually saw — black = bg, white = stroke.
    showDebugOverlay(dilated, results[0].label, results[0].confidence);
    dilated.dispose();

    return results;
  }
}
