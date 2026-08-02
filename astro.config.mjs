import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const base = normalizeBase(process.env.PUBLIC_BASE_PATH || '/');
const wasmEnabled = process.env.PUBLIC_RHYDB_WASM_ENABLED === 'true';
const isolationHeaders = wasmEnabled
    ? {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
      }
    : undefined;

export default defineConfig({
    output: 'static',
    base,
    publicDir: '.generated-public',
    server: {
        port: 5001,
        host: true,
        headers: isolationHeaders,
    },
    build: {
        format: 'directory',
    },
    integrations: [react(), mdx({ syntaxHighlight: false })],
    vite: {
        plugins: [tailwindcss()],
        server: {
            headers: isolationHeaders,
        },
        preview: {
            headers: isolationHeaders,
        },
    },
});

function normalizeBase(value) {
    if (value === '/') return '/';
    return `/${value.replace(/^\/+|\/+$/g, '')}`;
}
