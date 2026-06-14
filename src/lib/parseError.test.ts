import { describe, expect, it } from 'vitest';
import { parseErrorPosition } from './parseError';

describe('parseErrorPosition', () => {
    it('extracts a 1-based line and column', () => {
        expect(parseErrorPosition('Parse error at 2:21: Expected RightParen but got LeftBrace')).toEqual({
            line: 2,
            column: 21,
        });
    });

    it('returns null when there is no position', () => {
        expect(parseErrorPosition('Bad request')).toBeNull();
    });

    it('returns null for non-string input', () => {
        expect(parseErrorPosition(undefined)).toBeNull();
    });
});
