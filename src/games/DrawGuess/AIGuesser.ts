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

// Render a [H,W,1] float tensor (values 0-1) into a new canvas, scaled up for visibility
function tensorToCanvas(tensor: tf.Tensor3D, scale = 10): HTMLCanvasElement {
  const [h, w] = tensor.shape;
  const c = document.createElement('canvas');
  c.width = w * scale;
  c.height = h * scale;
  const ctx = c.getContext('2d')!;
  const data = tensor.dataSync();
  const imageData = ctx.createImageData(w, h);
  for (let i = 0; i < h * w; i++) {
    const v = Math.round(data[i] * 255);
    imageData.data[i * 4 + 0] = v;
    imageData.data[i * 4 + 1] = v;
    imageData.data[i * 4 + 2] = v;
    imageData.data[i * 4 + 3] = 255;
  }
  // Draw at 1x then scale up so pixels are visible
  const tmp = document.createElement('canvas');
  tmp.width = w; tmp.height = h;
  tmp.getContext('2d')!.putImageData(imageData, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, 0, 0, w * scale, h * scale);
  return c;
}

// Crop the canvas to the tight bounding box of non-white pixels + padding,
// returning a new square canvas ready for 28×28 downscaling.
function cropToStrokesBoundingBox(canvas: HTMLCanvasElement, padding = 10): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const pixels = ctx.getImageData(0, 0, width, height).data;

  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      // Non-white pixel (stroke)
      if (r < 250 || g < 250 || b < 250) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Fallback: nothing drawn yet, return whole canvas
  if (maxX <= minX || maxY <= minY) return canvas;

  // Add padding and clamp to canvas bounds
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width  - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  // Make it square by extending the shorter side (keeps aspect ratio for the model)
  const bw = maxX - minX;
  const bh = maxY - minY;
  const size = Math.max(bw, bh);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const sx = Math.max(0, Math.round(cx - size / 2));
  const sy = Math.max(0, Math.round(cy - size / 2));
  const sw = Math.min(width  - sx, size);
  const sh = Math.min(height - sy, size);

  const out = document.createElement('canvas');
  out.width = sw;
  out.height = sh;
  const outCtx = out.getContext('2d')!;
  outCtx.fillStyle = '#ffffff';
  outCtx.fillRect(0, 0, sw, sh);
  outCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return out;
}

async function saveDebugLog(
  rawCanvas: HTMLCanvasElement,
  croppedCanvas: HTMLCanvasElement,
  preprocessed: tf.Tensor3D,
  predictions: Ml5Result[],
) {
  try {
    const rawPng       = rawCanvas.toDataURL('image/png');
    const croppedPng   = croppedCanvas.toDataURL('image/png');
    const previewCanvas = tensorToCanvas(preprocessed, 10);
    const preprocessedPng = previewCanvas.toDataURL('image/png');

    await fetch('/debug-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawPng, croppedPng, preprocessedPng, predictions }),
    });
  } catch {
    // debug only — never crash the game
  }
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

    // Crop canvas to the bounding box of drawn strokes, then scale to 28×28.
    // Quick Draw training images fill the full grid — without this, a small
    // drawing on a large canvas becomes scattered 1-pixel noise at 28×28.
    const cropped = cropToStrokesBoundingBox(canvas);

    // Build preprocessed tensor outside tidy so we can inspect + log it
    const rgb  = tf.browser.fromPixels(cropped).toFloat().div(255);
    const gray = rgb.mean(2, true) as tf.Tensor3D;
    const resized   = tf.image.resizeBilinear(gray, [INPUT_SIZE, INPUT_SIZE]);
    const inverted  = tf.scalar(1).sub(resized) as tf.Tensor3D;
    const batched   = inverted.expandDims(0);

    const outputTensor = this.model.predict(batched) as tf.Tensor;
    const probs = await (outputTensor.squeeze() as tf.Tensor1D).array() as number[];

    // Clean up tensors
    rgb.dispose(); gray.dispose(); resized.dispose();
    outputTensor.dispose(); batched.dispose();

    const indexed = probs.map((p, i) => ({ p, i }));
    indexed.sort((a, b) => b.p - a.p);
    const results = indexed.slice(0, topK).map(({ p, i }) => ({
      label: CLASS_NAMES[i] ?? `class_${i}`,
      confidence: p,
    }));

    console.log('[AIGuesser] Top predictions:', results.slice(0, 5).map(r => `${r.label}(${(r.confidence*100).toFixed(1)}%)`).join(', '));

    // Save debug images (fire-and-forget)
    saveDebugLog(canvas, cropped, inverted, results);
    inverted.dispose();

    return results;
  }
}
