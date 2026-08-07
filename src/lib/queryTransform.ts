export const DEFAULT_LIMIT = 100;

function withoutCommentsAndStrings(query: string) {
    return query.replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/--[^\n]*/g, '');
}

// Appends `.limit(100)` on a new line (so a trailing `--` comment can't swallow it) unless the query
// already sets a limit. RhyDB holds millions of sequences, so every query must stay bounded.
export function withLimit(query: string) {
    if (!query.trim()) return query;
    if (/\.limit\s*\(/.test(withoutCommentsAndStrings(query))) return query;
    return query + `\n.limit(${DEFAULT_LIMIT})`;
}
