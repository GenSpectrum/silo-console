import { withLimit } from './queryTransform';
import type { QueryResult, QueryRow } from './types';

export type RhyDBQueryError = Error & {
    rhydbMessage?: string;
};

function errorMessage(err: unknown) {
    return err instanceof Error ? err.message : String(err);
}

// Sends a RhyDB query to <base>/query and parses the NDJSON response. Returns
// { rows, dataVersion, executionMs, downloadMs, elapsedMs } on success — executionMs is the wait
// until response headers arrive, downloadMs is the time to read the body, elapsedMs their sum.
// Throws an Error whose message is a human-readable description on failure;
// when the server returned a structured error, err.rhydbMessage holds its message.
export async function runQuery(base: string, query: string): Promise<QueryResult> {
    const t0 = performance.now();

    let response;
    try {
        response = await fetch(base + '/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'Accept': 'application/x-ndjson',
            },
            body: query,
        });
    } catch (err) {
        throw new Error('Network error: ' + errorMessage(err));
    }

    const executionMs = Math.round(performance.now() - t0);
    const raw = await response.text();
    const downloadMs = Math.round(performance.now() - t0) - executionMs;

    if (!response.ok) {
        let detail = raw;
        let rhydbMessage;
        try {
            const parsed = JSON.parse(raw);
            detail = JSON.stringify(parsed, null, 2);
            rhydbMessage = parsed.message;
        } catch {
            rhydbMessage = undefined;
        }
        const err: RhyDBQueryError = new Error('HTTP ' + response.status + ' ' + response.statusText + '\n\n' + detail);
        err.rhydbMessage = rhydbMessage;
        throw err;
    }

    const rows: QueryRow[] = [];
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
            rows.push(JSON.parse(trimmed));
        } catch (e) {
            throw new Error('Failed to parse NDJSON line: ' + errorMessage(e) + '\n' + trimmed);
        }
    }

    return {
        rows,
        dataVersion: response.headers.get('data-version') || '',
        executionMs,
        downloadMs,
        elapsedMs: executionMs + downloadMs,
    };
}

// Runs a query with a default `.limit(100)` appended (see withLimit).
export async function runBounded(base: string, rawQuery: string) {
    return runQuery(base, withLimit(rawQuery));
}
