import { describe, expect, it } from 'vitest';
import { isOrderingError, withLimit } from './queryTransform';

describe('withLimit', () => {
    it('appends .limit(100) on a new line', () => {
        expect(withLimit('default.groupBy({count:=count()})')).toBe('default.groupBy({count:=count()})\n.limit(100)');
    });

    it('leaves a query that already has a limit unchanged', () => {
        const q = 'default.orderBy({strain}).limit(20)';
        expect(withLimit(q)).toBe(q);
    });

    it('still appends a limit when the query ends with a -- comment', () => {
        const result = withLimit('default.orderBy({strain}) -- show first rows');
        expect(result.endsWith('.limit(100)')).toBe(true);
    });

    it('ignores .limit( inside a string literal', () => {
        const result = withLimit("default.filter(country = 'has .limit( text')");
        expect(result.endsWith('.limit(100)')).toBe(true);
    });

    it('returns empty/whitespace input unchanged', () => {
        expect(withLimit('   ')).toBe('   ');
    });
});

describe('isOrderingError', () => {
    it('matches the RhyDB ordering rejection', () => {
        expect(isOrderingError('Offset and limit can only be applied if the output ... has ordering')).toBe(true);
    });

    it('is false for other messages and non-strings', () => {
        expect(isOrderingError('Bad request')).toBe(false);
        expect(isOrderingError(undefined)).toBe(false);
    });
});
