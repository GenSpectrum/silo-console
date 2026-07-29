/// <reference lib="webworker" />

import {
    BlobReader,
    BlobWriter,
    Uint8ArrayReader,
    Uint8ArrayWriter,
    ZipReader,
    ZipWriter,
    type Entry,
} from '@zip.js/zip.js';
import type { LocalSiloEvent, LocalSiloProgress, LocalSiloRequest, LocalSiloResponse } from './localSiloProtocol';
import type { QueryResult, QueryRow } from './types';
import type { SiloInfo } from './siloInfo';

type EmscriptenFs = {
    analyzePath(path: string): { exists: boolean };
    chdir(path: string): void;
    mkdir(path: string): void;
    readdir(path: string): string[];
    readFile(path: string): Uint8Array;
    rmdir(path: string): void;
    unlink(path: string): void;
    writeFile(path: string, data: Uint8Array | string): void;
};

type SiloModule = {
    FS: EmscriptenFs;
    preprocess(configPath: string): number;
    load(stateDirectory: string): number;
    save(handle: number, outputDirectory: string): void;
    query(handle: number, query: string): string;
    info(handle: number): string;
    dispose(handle: number): void;
    getExceptionMessage(error: unknown): string | string[];
};

const worker = self as DedicatedWorkerGlobalScope;
const MAX_EXPANDED_STATE_BYTES = 2 * 1024 * 1024 * 1024;
let modulePromise: Promise<SiloModule> | null = null;
let currentHandle: number | null = null;
let requestQueue = Promise.resolve();

worker.onmessage = (event: MessageEvent<LocalSiloRequest>) => {
    requestQueue = requestQueue.then(() => handleRequest(event.data));
};

async function handleRequest(request: LocalSiloRequest) {
    try {
        let value: SiloInfo | QueryResult | Blob | undefined;
        switch (request.type) {
            case 'preprocess':
                value = await preprocess(request.config, request.files);
                break;
            case 'load-state':
                value = await loadState(request.file);
                break;
            case 'query':
                value = await query(request.query);
                break;
            case 'save-state':
                value = await saveState();
                break;
            case 'dispose':
                await dispose();
                break;
        }
        post({ id: request.id, ok: true, value });
    } catch (error) {
        const message = exceptionMessage(await modulePromise?.catch(() => null), error);
        post({ id: request.id, ok: false, error: message, siloMessage: message });
    }
}

async function getModule() {
    if (!modulePromise) {
        progress('loading', 'Loading SILO…');
        const loaderUrl = new URL(`${import.meta.env.BASE_URL}silo-wasm/silo_wasm.js`, worker.location.origin).href;
        modulePromise = import(/* @vite-ignore */ loaderUrl).then(async ({ default: createSiloModule }) => {
            return (await createSiloModule({
                locateFile: (filename: string) => new URL(filename, loaderUrl).href,
                print: (message: unknown) => log(String(message)),
                printErr: (message: unknown) => log(String(message)),
            })) as SiloModule;
        });
    }
    return modulePromise;
}

async function preprocess(config: string, files: File[]) {
    const module = await getModule();
    disposeHandle(module);
    removeTreeIfExists(module.FS, '/input');
    mkdirp(module.FS, '/input');
    module.FS.writeFile('/input/preprocessing_config.yaml', config);

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    let completedBytes = 0;
    for (const file of files) {
        progress('copying', `Adding ${file.name}…`, completedBytes, totalBytes);
        module.FS.writeFile(`/input/${file.name}`, new Uint8Array(await file.arrayBuffer()));
        completedBytes += file.size;
    }
    progress('preprocessing', 'Preprocessing data in this browser…', completedBytes, totalBytes);
    module.FS.chdir('/input');
    currentHandle = module.preprocess('preprocessing_config.yaml');
    module.FS.chdir('/');
    removeTreeIfExists(module.FS, '/input');
    progress('ready', 'Local data is ready.');
    return parseInfo(module.info(currentHandle));
}

async function loadState(file: File) {
    const module = await getModule();
    disposeHandle(module);
    removeTreeIfExists(module.FS, '/loaded-state');
    mkdirp(module.FS, '/loaded-state');
    progress('loading-state', 'Opening processed state…');

    const zipReader = new ZipReader(new BlobReader(file));
    try {
        const entries = await zipReader.getEntries();
        validateEntries(entries);
        let completedBytes = 0;
        const totalBytes = entries.reduce((sum, entry) => sum + (entry.uncompressedSize || 0), 0);
        for (const entry of entries) {
            const path = `/loaded-state/${entry.filename.replace(/\/$/, '')}`;
            if (entry.directory) {
                mkdirp(module.FS, path);
                continue;
            }
            mkdirp(module.FS, path.split('/').slice(0, -1).join('/'));
            const bytes = await entry.getData?.(new Uint8ArrayWriter(), { checkSignature: true });
            if (!bytes) throw new Error(`Could not read ${entry.filename} from the processed-state ZIP.`);
            module.FS.writeFile(path, bytes);
            completedBytes += bytes.byteLength;
            progress('loading-state', `Loading ${entry.filename}…`, completedBytes, totalBytes);
        }
    } finally {
        await zipReader.close();
    }

    try {
        currentHandle = module.load('/loaded-state');
    } catch (rootError) {
        const enclosingDirectory = singleTopLevelDirectory(module.FS, '/loaded-state');
        if (!enclosingDirectory) throw rootError;
        currentHandle = module.load(enclosingDirectory);
    }
    const info = parseInfo(module.info(currentHandle));
    removeTreeIfExists(module.FS, '/loaded-state');
    progress('ready', 'Local data is ready.');
    return info;
}

async function query(queryText: string): Promise<QueryResult> {
    const module = await getModule();
    const handle = requireHandle();
    const startedAt = performance.now();
    const raw = module.query(handle, queryText);
    const elapsedMs = Math.round(performance.now() - startedAt);
    return {
        rows: parseNdjson(raw),
        dataVersion: '',
        executionMs: elapsedMs,
        downloadMs: 0,
        elapsedMs,
        source: 'local',
    };
}

async function saveState() {
    const module = await getModule();
    const handle = requireHandle();
    removeTreeIfExists(module.FS, '/state');
    mkdirp(module.FS, '/state');
    progress('saving', 'Saving processed state…');
    module.save(handle, '/state');

    const writer = new BlobWriter('application/zip');
    const zip = new ZipWriter(writer);
    try {
        const files = listFiles(module.FS, '/state');
        for (let index = 0; index < files.length; index += 1) {
            const file = files[index];
            progress('saving', `Packaging ${file.relativePath}…`, index, files.length);
            await zip.add(file.relativePath, new Uint8ArrayReader(module.FS.readFile(file.path)), { level: 0 });
        }
        return await zip.close();
    } finally {
        removeTreeIfExists(module.FS, '/state');
    }
}

async function dispose() {
    if (!modulePromise) return;
    const module = await modulePromise;
    disposeHandle(module);
}

function disposeHandle(module: SiloModule) {
    if (currentHandle !== null) module.dispose(currentHandle);
    currentHandle = null;
}

function requireHandle() {
    if (currentHandle === null) throw new Error('Load or preprocess local data before querying it.');
    return currentHandle;
}

function validateEntries(entries: Entry[]) {
    const paths = new Set<string>();
    let totalBytes = 0;
    for (const entry of entries) {
        const path = entry.filename.replace(/\\/g, '/');
        const parts = path.split('/').filter(Boolean);
        if (!path || path.startsWith('/') || parts.includes('..')) {
            throw new Error(`The processed-state ZIP contains an unsafe path: ${entry.filename}`);
        }
        if (paths.has(path)) throw new Error(`The processed-state ZIP contains a duplicate path: ${path}`);
        paths.add(path);
        if (entry.encrypted) {
            throw new Error('Encrypted processed-state ZIP files are not supported.');
        }
        if (entry.unixMode !== undefined && (entry.unixMode & 0o170000) === 0o120000) {
            throw new Error(`The processed-state ZIP contains a symbolic link: ${path}`);
        }
        totalBytes += entry.uncompressedSize || 0;
        if (totalBytes > MAX_EXPANDED_STATE_BYTES) {
            throw new Error('The processed state expands beyond the 2 GiB browser-WASM limit.');
        }
    }
    if (!entries.some((entry) => !entry.directory)) throw new Error('The processed-state ZIP is empty.');
}

function parseInfo(raw: string): SiloInfo {
    const value = JSON.parse(raw) as Partial<SiloInfo>;
    if (typeof value.version !== 'string' || typeof value.sequenceCount !== 'number') {
        throw new Error('SILO returned invalid database information.');
    }
    return value as SiloInfo;
}

function parseNdjson(raw: string) {
    const rows: QueryRow[] = [];
    for (const line of raw.split('\n')) {
        if (line.trim()) rows.push(JSON.parse(line) as QueryRow);
    }
    return rows;
}

function mkdirp(fs: EmscriptenFs, path: string) {
    let current = '';
    for (const part of path.split('/').filter(Boolean)) {
        current += `/${part}`;
        if (!fs.analyzePath(current).exists) fs.mkdir(current);
    }
}

function removeTreeIfExists(fs: EmscriptenFs, path: string) {
    if (!fs.analyzePath(path).exists) return;
    for (const entry of fs.readdir(path)) {
        if (entry === '.' || entry === '..') continue;
        const child = `${path}/${entry}`;
        try {
            fs.readdir(child);
            removeTreeIfExists(fs, child);
        } catch {
            fs.unlink(child);
        }
    }
    fs.rmdir(path);
}

function listFiles(fs: EmscriptenFs, root: string) {
    const files: Array<{ path: string; relativePath: string }> = [];
    walk(root);
    return files;

    function walk(directory: string) {
        for (const entry of fs.readdir(directory)) {
            if (entry === '.' || entry === '..') continue;
            const path = `${directory}/${entry}`;
            try {
                fs.readdir(path);
                walk(path);
            } catch {
                files.push({ path, relativePath: path.slice(root.length + 1) });
            }
        }
    }
}

function singleTopLevelDirectory(fs: EmscriptenFs, root: string) {
    const entries = fs.readdir(root).filter((entry) => entry !== '.' && entry !== '..');
    if (entries.length !== 1) return null;
    const path = `${root}/${entries[0]}`;
    try {
        fs.readdir(path);
        return path;
    } catch {
        return null;
    }
}

function exceptionMessage(module: SiloModule | null | undefined, error: unknown) {
    if (module) {
        try {
            const value = module.getExceptionMessage(error);
            return Array.isArray(value)
                ? value.filter(Boolean).map(describeErrorValue).join(': ')
                : describeErrorValue(value);
        } catch {
            // Fall through to the JavaScript error below.
        }
    }
    return error instanceof Error ? error.message : String(error);
}

function describeErrorValue(value: unknown) {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.message;
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function progress(stage: LocalSiloProgress['stage'], message: string, completedBytes?: number, totalBytes?: number) {
    post({ event: { type: 'progress', value: { stage, message, completedBytes, totalBytes } } });
}

function log(message: string) {
    post({ event: { type: 'log', message } });
}

function post(message: LocalSiloResponse) {
    worker.postMessage(message);
}
