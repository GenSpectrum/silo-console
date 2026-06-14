export const DEFAULT_LIMIT = 100;

function withoutCommentsAndStrings(query) {
    return query.replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/--[^\n]*/g, '');
}

// Appends `.limit(100)` on a new line (so a trailing `--` comment can't swallow it) unless the query
// already sets a limit. SILO holds millions of sequences, so every query must stay bounded.
export function withLimit(query) {
    if (!query.trim()) return query;
    if (/\.limit\s*\(/.test(withoutCommentsAndStrings(query))) return query;
    return query + `\n.limit(${DEFAULT_LIMIT})`;
}

// True for SILO's "limit on unordered output" rejection, which runBounded retries without the limit.
export function isOrderingError(message) {
    return typeof message === 'string' && message.includes('can only be applied if the output');
}
