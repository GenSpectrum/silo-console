import { withLimit } from './queryTransform';

function shellQuote(value: string) {
    return "'" + value.replace(/'/g, "'\\''") + "'";
}

export function buildCurlCommand(base: string, rawQuery: string) {
    const url = base.replace(/\/+$/, '') + '/query';
    const query = withLimit(rawQuery);

    return [
        'curl',
        '-X POST',
        shellQuote(url),
        "-H 'Content-Type: text/plain'",
        "-H 'Accept: application/x-ndjson'",
        '--data-binary ' + shellQuote(query),
    ].join(' \\\n  ');
}
