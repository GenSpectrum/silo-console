import { buildCurlCommand } from './curlCommand';
import { isOrderingError, withLimit } from './queryTransform';
import { runQuery, type SiloQueryError } from './runQuery';
import type { QueryResult } from './types';

export type QueryTarget = {
    id: string;
    kind: 'remote' | 'local';
    run(query: string): Promise<QueryResult>;
    curlCommand?: (query: string) => string;
};

export function remoteQueryTarget(server: string): QueryTarget {
    return {
        id: server,
        kind: 'remote',
        run: (query) => runQuery(server, query),
        curlCommand: (query) => buildCurlCommand(server, query),
    };
}

export async function runBoundedTarget(target: QueryTarget, rawQuery: string) {
    const limited = withLimit(rawQuery);
    try {
        return await target.run(limited);
    } catch (error) {
        if (limited !== rawQuery && isOrderingError((error as SiloQueryError).siloMessage)) {
            return target.run(rawQuery);
        }
        throw error;
    }
}
