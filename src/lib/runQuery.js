import { isOrderingError, withLimit } from './queryTransform.js';

// Sends a SaneQL query to <base>/query and parses the NDJSON response. Returns
// { rows, dataVersion, executionMs, downloadMs, elapsedMs } on success — executionMs is the wait
// until response headers arrive, downloadMs is the time to read the body, elapsedMs their sum.
// Throws an Error whose message is a human-readable description on failure;
// when the server returned a structured error, err.siloMessage holds its message.
export async function runQuery(base, query) {
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
        throw new Error('Network error: ' + err.message);
    }

    const executionMs = Math.round(performance.now() - t0);
    const raw = await response.text();
    const downloadMs = Math.round(performance.now() - t0) - executionMs;

    if (!response.ok) {
        let detail = raw;
        let siloMessage;
        try {
            const parsed = JSON.parse(raw);
            detail = JSON.stringify(parsed, null, 2);
            siloMessage = parsed.message;
        } catch {
            siloMessage = undefined;
        }
        const err = new Error('HTTP ' + response.status + ' ' + response.statusText + '\n\n' + detail);
        err.siloMessage = siloMessage;
        throw err;
    }

    const rows = [];
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
            rows.push(JSON.parse(trimmed));
        } catch (e) {
            throw new Error('Failed to parse NDJSON line: ' + e.message + '\n' + trimmed);
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

// Runs a query with a default `.limit(100)` appended (see withLimit). If the
// server rejects the limit because the output is unordered/aggregated, retries
// once with the original, un-limited query.
export async function runBounded(base, rawQuery) {
    const limited = withLimit(rawQuery);
    try {
        return await runQuery(base, limited);
    } catch (err) {
        if (limited !== rawQuery && isOrderingError(err.siloMessage)) {
            return await runQuery(base, rawQuery);
        }
        throw err;
    }
}
