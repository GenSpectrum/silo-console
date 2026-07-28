import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSiloInfo } from './siloInfo';

afterEach(() => vi.unstubAllGlobals());

describe('fetchSiloInfo', () => {
    it('returns a valid SILO info response', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(JSON.stringify({ version: 'abc123', sequenceCount: 42 }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }),
            ),
        );

        await expect(fetchSiloInfo('https://example.org/silo')).resolves.toEqual({
            version: 'abc123',
            sequenceCount: 42,
        });
        expect(fetch).toHaveBeenCalledWith('https://example.org/silo/info');
    });

    it('reports an invalid response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
        await expect(fetchSiloInfo('https://example.org/silo')).rejects.toThrow('does not look like a SILO');
    });

    it('turns fetch failures into actionable connection errors', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('blocked')));
        await expect(fetchSiloInfo('https://example.org/silo')).rejects.toThrow('network access, and CORS');
    });
});
