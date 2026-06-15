import { describe, expect, it } from 'vitest';
import { buildCurlCommand } from './curlCommand';

describe('buildCurlCommand', () => {
    it('builds the SILO query request with the bounded query', () => {
        expect(buildCurlCommand('https://example.test/silo/', 'default.groupBy({count:=count()})')).toBe(
            `curl \\
  -X POST \\
  'https://example.test/silo/query' \\
  -H 'Content-Type: text/plain' \\
  -H 'Accept: application/x-ndjson' \\
  --data-binary 'default.groupBy({count:=count()})
.limit(100)'`,
        );
    });

    it('quotes single quotes in the query safely', () => {
        expect(buildCurlCommand('https://example.test', "default.filter(country = 'Switzerland')")).toContain(
            "country = '\\''Switzerland'\\''",
        );
    });
});
