import { describe, expect, it, vi } from 'vitest';
import { runTargetQuery, type QueryTarget } from './queryTarget';

function target(run: QueryTarget['run']): QueryTarget {
    return { id: 'test', kind: 'remote', run };
}

describe('runTargetQuery', () => {
    it('bounds ordinary queries', async () => {
        const run = vi.fn(async () => ({
            rows: [],
            dataVersion: '',
            elapsedMs: 0,
            executionMs: 0,
            downloadMs: 0,
        }));

        await runTargetQuery(target(run), 'default', false);

        expect(run).toHaveBeenCalledWith('default\n.limit(100)');
    });

    it('can return a complete exercise result', async () => {
        const run = vi.fn(async () => ({
            rows: [],
            dataVersion: '',
            elapsedMs: 0,
            executionMs: 0,
            downloadMs: 0,
        }));
        const query = 'default.groupBy({count := count()}, {pangoLineage})';

        await runTargetQuery(target(run), query, true);

        expect(run).toHaveBeenCalledWith(query);
    });
});
