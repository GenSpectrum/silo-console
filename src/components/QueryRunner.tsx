import { useCallback, useEffect, useState } from 'react';
import { useServer } from '../server/ServerContext';
import { runBounded } from '../lib/runQuery';
import { resultsMatch } from '../lib/compareResults';
import { celebrate } from '../lib/celebrate';
import { parseErrorPosition } from '../lib/parseError';
import { buildCurlCommand } from '../lib/curlCommand';
import QueryEditor from './QueryEditor';
import ResultsTable from './ResultsTable';
import type { ErrorPosition, QueryResult, QueryRow } from '../lib/types';
import type { SiloQueryError } from '../lib/runQuery';

// Caches reference-answer results by `${base}\n${query}` so re-running an
// exercise doesn't repeatedly re-query the server for the same answer.
const referenceCache = new Map<string, QueryRow[]>();

async function getReferenceRows(base: string, referenceQuery: string) {
    const key = base + '\n' + referenceQuery;
    const cached = referenceCache.get(key);
    if (cached) return cached;
    const res = await runBounded(base, referenceQuery);
    referenceCache.set(key, res.rows);
    return res.rows;
}

type Verdict = {
    status: 'correct' | 'wrong' | 'unknown';
    message: string;
};

type ErrorMark = {
    position: ErrorPosition;
    message: string;
};

type QueryRunnerProps = {
    initialQuery?: string;
    referenceQuery?: string;
};

// Reusable query widget: editor + Run button + status/meta/error + results table.
// When `referenceQuery` is provided (exercise mode), the user's result is
// compared against the reference answer and a Correct!/Wrong! verdict is shown.
export default function QueryRunner({ initialQuery = '', referenceQuery }: QueryRunnerProps) {
    const { getBase } = useServer();
    const [query, setQuery] = useState(initialQuery);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorMark, setErrorMark] = useState<ErrorMark | null>(null);
    const [result, setResult] = useState<QueryResult | null>(null);
    const [verdict, setVerdict] = useState<Verdict | null>(null);
    const [showCurl, setShowCurl] = useState(false);
    const [curlCopied, setCurlCopied] = useState(false);

    const handleChange = useCallback((value: string) => {
        setQuery(value);
        setErrorMark(null);
        setCurlCopied(false);
    }, []);

    useEffect(() => {
        if (verdict?.status === 'correct') celebrate();
    }, [verdict]);

    const run = useCallback(async () => {
        setError(null);
        setErrorMark(null);
        setResult(null);
        setVerdict(null);
        if (!query.trim()) return;

        setRunning(true);
        try {
            const base = getBase();
            const res = await runBounded(base, query);
            setResult(res);

            if (referenceQuery) {
                try {
                    const referenceRows = await getReferenceRows(base, referenceQuery);
                    setVerdict(
                        resultsMatch(res.rows, referenceRows)
                            ? { status: 'correct', message: 'Correct!' }
                            : { status: 'wrong', message: 'Wrong!' },
                    );
                } catch {
                    setVerdict({
                        status: 'unknown',
                        message: 'Could not verify (the reference answer failed to run).',
                    });
                }
            }
        } catch (err) {
            const queryError = err as SiloQueryError;
            setError(queryError.message);
            const position = parseErrorPosition(queryError.siloMessage);
            if (position) setErrorMark({ position, message: queryError.siloMessage || queryError.message });
        } finally {
            setRunning(false);
        }
    }, [query, referenceQuery, getBase]);

    const curlCommand = buildCurlCommand(getBase(), query);

    const copyCurlCommand = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(curlCommand);
            setCurlCopied(true);
        } catch {
            setCurlCopied(false);
        }
    }, [curlCommand]);

    const toggleCurlCommand = useCallback(() => {
        setShowCurl((value) => !value);
        setCurlCopied(false);
    }, []);

    return (
        <div>
            <QueryEditor
                value={query}
                onChange={handleChange}
                onRun={run}
                status={verdict?.status}
                errorPosition={errorMark?.position}
                errorMessage={errorMark?.message}
            />
            <div className='toolbar'>
                <button onClick={run} disabled={running}>
                    Run (Ctrl/Cmd+Enter)
                </button>
                <button className='secondary subtle' onClick={toggleCurlCommand}>
                    cURL
                </button>
                {running && <span className='hint'>Running…</span>}
            </div>

            {showCurl && (
                <div className='curl-box'>
                    <pre>{curlCommand}</pre>
                    <button className='secondary' onClick={copyCurlCommand}>
                        {curlCopied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            )}

            {verdict && <div className={`verdict ${verdict.status}`}>{verdict.message}</div>}

            {error && <div className='error'>{error}</div>}

            {result && (
                <>
                    <div className='meta'>
                        {result.rows.length} row{result.rows.length === 1 ? '' : 's'} · {result.executionMs} ms until
                        first content download + {result.downloadMs} ms download (= {result.elapsedMs} ms total)
                        {result.dataVersion ? ` · data-version ${result.dataVersion}` : ''}
                    </div>
                    <ResultsTable rows={result.rows} />
                </>
            )}
        </div>
    );
}
