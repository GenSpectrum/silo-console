import type { QueryResult } from './types';
import type { SiloInfo } from './siloInfo';

export type LocalSiloProgress = {
    stage: 'loading' | 'copying' | 'preprocessing' | 'loading-state' | 'saving' | 'ready';
    message: string;
    completedBytes?: number;
    totalBytes?: number;
};

export type LocalSiloEvent = { type: 'progress'; value: LocalSiloProgress } | { type: 'log'; message: string };

export type LocalSiloRequest =
    | { id: number; type: 'preprocess'; config: string; files: File[] }
    | { id: number; type: 'load-state'; file: File }
    | { id: number; type: 'query'; query: string }
    | { id: number; type: 'save-state' }
    | { id: number; type: 'dispose' };

export type LocalSiloCommand = LocalSiloRequest extends infer Request
    ? Request extends { id: number }
        ? Omit<Request, 'id'>
        : never
    : never;

export type LocalSiloResponse =
    | { id: number; ok: true; value?: SiloInfo | QueryResult | Blob }
    | { id: number; ok: false; error: string; siloMessage?: string }
    | { event: LocalSiloEvent };
