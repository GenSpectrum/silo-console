import { describe, expect, it } from 'vitest';
import { resultsMatch } from './compareResults.js';

describe('resultsMatch', () => {
    it('is true regardless of row order', () => {
        const a = [
            { country: 'CH', count: 2 },
            { country: 'DE', count: 1 },
        ];
        const b = [
            { country: 'DE', count: 1 },
            { country: 'CH', count: 2 },
        ];
        expect(resultsMatch(a, b)).toBe(true);
    });

    it('is true regardless of key order within a row', () => {
        expect(resultsMatch([{ a: 1, b: 2 }], [{ b: 2, a: 1 }])).toBe(true);
    });

    it('is false when a value differs', () => {
        expect(resultsMatch([{ count: 1 }], [{ count: 2 }])).toBe(false);
    });

    it('is false when the row counts differ', () => {
        expect(resultsMatch([{ count: 1 }], [{ count: 1 }, { count: 1 }])).toBe(false);
    });

    it('treats null and missing distinctly via stable stringify', () => {
        expect(resultsMatch([{ a: null }], [{ a: 0 }])).toBe(false);
    });
});
