// After `vite build`, copy dist/index.html into a real folder per route so that
// every URL (/console, /languageReference, /exercises/<slug>, ...) resolves to an
// actual file. This makes direct loads and refreshes work on static hosts
// (nginx, GitHub Pages) with no SPA-fallback configuration.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exercises } from '../src/data/exercises.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const indexHtml = join(dist, 'index.html');

const routes = ['console', 'languageReference', 'exercises', ...exercises.map((e) => `exercises/${e.slug}`)];

for (const route of routes) {
    const dir = join(dist, route);
    mkdirSync(dir, { recursive: true });
    copyFileSync(indexHtml, join(dir, 'index.html'));
    console.log(`wrote ${route}/index.html`);
}

// SPA fallback: GitHub Pages serves 404.html for any path without a matching file, which boots the
// app and lets the client router handle the route.
copyFileSync(indexHtml, join(dist, '404.html'));
console.log(`postbuild: created ${routes.length} route files + 404.html`);
