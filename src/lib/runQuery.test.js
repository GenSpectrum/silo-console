import { afterEach, describe, expect, it, vi } from 'vitest';
import { runBounded } from './runQuery.js';

function response({ ok, status = 200, body = '', dataVersion = '' }) {
    return {
        ok,
        status,
        statusText: ok ? 'OK' : 'Bad Request',
        text: async () => body,
        headers: { get: (key) => (key === 'data-version' ? dataVersion : null) },
    };
}

afterEach(() => vi.unstubAllGlobals());

describe('runBounded', () => {
    it('parses NDJSON rows and the data-version on success', async () => {
        const fetchMock = vi.fn(async () => response({ ok: true, body: '{"count":5}\n', dataVersion: '42' }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await runBounded('http://silo', 'default.project({strain}).limit(20)');

        expect(result.rows).toEqual([{ count: 5 }]);
        expect(result.dataVersion).toBe('42');
        expect(result.elapsedMs).toBe(result.executionMs + result.downloadMs);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('retries without the appended limit on an ordering error', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                response({
                    ok: false,
                    status: 400,
                    body: JSON.stringify({ message: 'limit can only be applied if the output has ordering' }),
                }),
            )
            .mockResolvedValueOnce(response({ ok: true, body: '{"count":9}\n' }));
        vi.stubGlobal('fetch', fetchMock);

        const raw = 'default.groupBy({count:=count()})';
        const result = await runBounded('http://silo', raw);

        expect(result.rows).toEqual([{ count: 9 }]);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[0][1].body).toContain('.limit(100)');
        expect(fetchMock.mock.calls[1][1].body).toBe(raw);
    });
});
