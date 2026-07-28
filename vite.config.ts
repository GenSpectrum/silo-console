import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

// `base` lets the app be served from a sub-path (e.g. GitHub Pages project sites).
// Default is "/" for root deployments (nginx, custom domains).
const base = process.env.VITE_BASE || '/';

export default defineConfig({
    base,
    plugins: [tailwindcss(), react()],
    server: {
        port: 5001,
        host: true,
    },
    preview: {
        port: 5001,
        host: true,
    },
});
