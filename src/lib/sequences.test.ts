import { describe, expect, it } from 'vitest';
import { classifyColumns } from './sequences';

const seqA = 'A'.repeat(60);
const seqB = 'C'.repeat(60);
const shortSeq = 'A'.repeat(30);

describe('classifyColumns', () => {
    it('detects an aligned sequence column (equal lengths)', () => {
        const rows = [{ S: seqA }, { S: seqB }];
        expect(classifyColumns(rows, ['S']).S).toEqual({ isSequence: true, isAligned: true, length: 60 });
    });

    it('detects an unaligned sequence column (varying lengths)', () => {
        const rows = [{ seq: seqA }, { seq: seqA + 'TT' }];
        const result = classifyColumns(rows, ['seq']).seq;
        expect(result.isSequence).toBe(true);
        expect(result.isAligned).toBe(false);
        expect(result.length).toBeNull();
    });

    it('does not treat short strings as sequences', () => {
        const rows = [{ country: 'Switzerland' }, { country: 'Germany' }];
        expect(classifyColumns(rows, ['country']).country.isSequence).toBe(false);
    });

    it('does not treat long free text (commas/spaces) as a sequence', () => {
        const lab = 'Department of Virology, Some Big University Hospital, City, Country';
        const rows = [{ originatingLab: lab }, { originatingLab: lab }];
        expect(classifyColumns(rows, ['originatingLab']).originatingLab.isSequence).toBe(false);
    });

    it('treats a single long value as a (trivially aligned) sequence', () => {
        expect(classifyColumns([{ main: shortSeq + shortSeq }], ['main']).main).toEqual({
            isSequence: true,
            isAligned: true,
            length: 60,
        });
    });

    it('ignores nulls when judging equal length', () => {
        const rows = [{ S: seqA }, { S: null }, { S: seqB }];
        expect(classifyColumns(rows, ['S']).S.isAligned).toBe(true);
    });
});
