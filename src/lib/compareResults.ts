import type { QueryRow } from './types';

// Deterministic JSON stringify with sorted object keys, so two rows with the
// same content but different key order compare equal.
function stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    const keys = Object.keys(value).sort();
    const object = value as Record<string, unknown>;
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(object[k])).join(',') + '}';
}

// Compares two result sets as multisets of rows (order-independent), so a query
// that returns the right rows in a different order still counts as correct.
export function resultsMatch(rowsA: QueryRow[], rowsB: QueryRow[]) {
    if (rowsA.length !== rowsB.length) return false;
    const a = rowsA.map(stableStringify).sort();
    const b = rowsB.map(stableStringify).sort();
    return a.every((v, i) => v === b[i]);
}
