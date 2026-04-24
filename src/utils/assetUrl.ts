// Resolves a public-folder path against Vite's BASE_URL.
// In dev: BASE_URL = '/'  →  '/config/words.json'
// On GitHub Pages: BASE_URL = './'  →  './config/words.json'  (relative, works on any subpath)
export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path;
}
