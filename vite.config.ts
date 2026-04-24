import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Dev-only middleware: POST /debug-log saves images + JSON to debug-logs/
function debugLogPlugin() {
  return {
    name: 'debug-log',
    configureServer(server: any) {
      server.middlewares.use('/debug-log', (req: any, res: any) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', () => {
          try {
            const payload = JSON.parse(body);
            const dir = path.resolve('debug-logs');
            fs.mkdirSync(dir, { recursive: true });
            // Clear previous logs — keep only the latest guess
            for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
            const ts = new Date().toISOString().replace(/[:.]/g, '-');

            // Save raw canvas PNG
            if (payload.rawPng) {
              const buf = Buffer.from(payload.rawPng.replace(/^data:image\/png;base64,/, ''), 'base64');
              fs.writeFileSync(path.join(dir, `${ts}_raw.png`), buf);
            }
            // Save cropped bounding-box PNG
            if (payload.croppedPng) {
              const buf = Buffer.from(payload.croppedPng.replace(/^data:image\/png;base64,/, ''), 'base64');
              fs.writeFileSync(path.join(dir, `${ts}_cropped.png`), buf);
            }
            // Save 28×28 preprocessed PNG (upscaled)
            if (payload.preprocessedPng) {
              const buf = Buffer.from(payload.preprocessedPng.replace(/^data:image\/png;base64,/, ''), 'base64');
              fs.writeFileSync(path.join(dir, `${ts}_28x28.png`), buf);
            }
            // Save predictions JSON
            if (payload.predictions) {
              fs.writeFileSync(path.join(dir, `${ts}_predictions.json`), JSON.stringify(payload.predictions, null, 2));
            }

            console.log(`[debug-log] Saved to debug-logs/${ts}_*`);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, ts }));
          } catch (e) {
            res.statusCode = 500; res.end(String(e));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [debugLogPlugin()],
  base: './',   // relative base so the build works on any GitHub Pages subpath
  server: { port: 5173 },
  build: { outDir: 'dist' },
});
