// After `vite build`, copy dist/index.html into a real folder per route so that
// every URL (/console, /languageReference, /exercises/<slug>, ...) resolves to an
// actual file. This makes direct loads and refreshes work on static hosts
// (nginx, GitHub Pages) with no SPA-fallback configuration.
import { copyFileSync, mkdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const indexHtml = join(dist, 'index.html');
const exercisesFile = join(root, 'src/data/exercises.ts');

async function loadExercises() {
    const source = await readFile(exercisesFile, 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
        },
    });
    const encoded = Buffer.from(outputText).toString('base64');
    return import(`data:text/javascript;base64,${encoded}`).then((module) => module.exercises);
}

const exercises = await loadExercises();
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
