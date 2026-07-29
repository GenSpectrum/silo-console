import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

// `base` lets the app be served from a sub-path (e.g. GitHub Pages project sites).
// Default is "/" for root deployments (nginx, custom domains).
const base = process.env.VITE_BASE || '/';
const wasmEnabled = process.env.VITE_SILO_WASM_ENABLED === 'true';
const isolationHeaders = wasmEnabled
    ? {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
      }
    : undefined;

export default defineConfig({
    base,
    publicDir: '.generated-public',
    plugins: [tailwindcss(), react()],
    server: {
        port: 5001,
        host: true,
        headers: isolationHeaders,
    },
    preview: {
        port: 5001,
        host: true,
        headers: isolationHeaders,
    },
});
