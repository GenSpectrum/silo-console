import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRhyDBInfo } from './rhydbInfo';

afterEach(() => vi.unstubAllGlobals());

describe('fetchRhyDBInfo', () => {
    it('returns a valid RhyDB info response', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(JSON.stringify({ version: 'abc123', sequenceCount: 42 }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }),
            ),
        );

        await expect(fetchRhyDBInfo('https://example.org/rhydb')).resolves.toEqual({
            version: 'abc123',
            sequenceCount: 42,
        });
        expect(fetch).toHaveBeenCalledWith('https://example.org/rhydb/info');
    });

    it('reports an invalid response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
        await expect(fetchRhyDBInfo('https://example.org/rhydb')).rejects.toThrow('does not look like a RhyDB');
    });

    it('turns fetch failures into actionable connection errors', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('blocked')));
        await expect(fetchRhyDBInfo('https://example.org/rhydb')).rejects.toThrow('network access, and CORS');
    });
});
