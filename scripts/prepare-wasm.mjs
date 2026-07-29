import { copyFile, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const enabled = process.env.VITE_SILO_WASM_ENABLED === 'true';
const projectRoot = path.resolve(import.meta.dirname, '..');
const generatedRoot = path.join(projectRoot, '.generated-public');
const generatedWasmDirectory = path.join(generatedRoot, 'silo-wasm');
const sourceDirectory = path.resolve(projectRoot, process.env.SILO_WASM_ASSET_DIR || '.silo-wasm');
const filenames = ['silo_wasm.js', 'silo_wasm.wasm'];

await rm(generatedRoot, { recursive: true, force: true });
await mkdir(generatedRoot, { recursive: true });

if (!enabled) process.exit(0);

await mkdir(generatedWasmDirectory, { recursive: true });

for (const filename of filenames) {
    const source = path.join(sourceDirectory, filename);
    try {
        if (!(await stat(source)).isFile()) throw new Error('not a file');
    } catch {
        throw new Error(
            `Local SILO WASM is enabled, but ${filename} was not found in ${sourceDirectory}. ` +
                'Download the artifact recorded in silo-wasm-source.txt or set SILO_WASM_ASSET_DIR.',
        );
    }
    await copyFile(source, path.join(generatedWasmDirectory, filename));
}
