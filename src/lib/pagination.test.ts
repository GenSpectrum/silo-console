import { describe, expect, it } from 'vitest';
import { getPaginationItems, getPageWindow } from './pagination';

describe('getPageWindow', () => {
    it('keeps up to 200 rows on one page', () => {
        expect(getPageWindow(200, 0)).toEqual({ pageIndex: 0, pageCount: 1, start: 0, end: 200 });
    });

    it('starts the second page at row index 200', () => {
        expect(getPageWindow(201, 1)).toEqual({ pageIndex: 1, pageCount: 2, start: 200, end: 201 });
    });

    it('returns a complete middle page', () => {
        expect(getPageWindow(5388, 1)).toEqual({ pageIndex: 1, pageCount: 27, start: 200, end: 400 });
    });

    it('clamps page indexes when the result size changes', () => {
        expect(getPageWindow(250, 9)).toEqual({ pageIndex: 1, pageCount: 2, start: 200, end: 250 });
        expect(getPageWindow(250, -1)).toEqual({ pageIndex: 0, pageCount: 2, start: 0, end: 200 });
    });
});

describe('getPaginationItems', () => {
    it('shows every page when there are seven or fewer', () => {
        expect(getPaginationItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('collapses pages after the beginning', () => {
        expect(getPaginationItems(0, 20)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 20]);
    });

    it('collapses pages on both sides in the middle', () => {
        expect(getPaginationItems(9, 20)).toEqual([1, 'start-ellipsis', 9, 10, 11, 'end-ellipsis', 20]);
    });

    it('collapses pages before the end', () => {
        expect(getPaginationItems(19, 20)).toEqual([1, 'start-ellipsis', 16, 17, 18, 19, 20]);
    });
});
