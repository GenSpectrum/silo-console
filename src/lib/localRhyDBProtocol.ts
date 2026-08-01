import type { QueryResult } from './types';
import type { RhyDBInfo } from './rhydbInfo';

export type LocalRhyDBProgress = {
    stage: 'loading' | 'copying' | 'preprocessing' | 'loading-state' | 'saving' | 'ready';
    message: string;
    completedBytes?: number;
    totalBytes?: number;
};

export type LocalRhyDBEvent = { type: 'progress'; value: LocalRhyDBProgress } | { type: 'log'; message: string };

export type LocalRhyDBRequest =
    | { id: number; type: 'preprocess'; config: string; files: File[] }
    | { id: number; type: 'load-state'; file: File }
    | { id: number; type: 'query'; query: string }
    | { id: number; type: 'save-state' }
    | { id: number; type: 'dispose' };

export type LocalRhyDBCommand = LocalRhyDBRequest extends infer Request
    ? Request extends { id: number }
        ? Omit<Request, 'id'>
        : never
    : never;

export type LocalRhyDBResponse =
    | { id: number; ok: true; value?: RhyDBInfo | QueryResult | Blob }
    | { id: number; ok: false; error: string; rhydbMessage?: string }
    | { event: LocalRhyDBEvent };
