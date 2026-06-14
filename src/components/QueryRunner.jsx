import { useCallback, useEffect, useState } from 'react';
import { useServer } from '../server/ServerContext.jsx';
import { runBounded } from '../lib/runQuery.js';
import { resultsMatch } from '../lib/compareResults.js';
import { celebrate } from '../lib/celebrate.js';
import { parseErrorPosition } from '../lib/parseError.js';
import QueryEditor from './QueryEditor.jsx';
import ResultsTable from './ResultsTable.jsx';

// Caches reference-answer results by `${base}\n${query}` so re-running an
// exercise doesn't repeatedly re-query the server for the same answer.
const referenceCache = new Map();

async function getReferenceRows(base, referenceQuery) {
    const key = base + '\n' + referenceQuery;
    if (referenceCache.has(key)) return referenceCache.get(key);
    const res = await runBounded(base, referenceQuery);
    referenceCache.set(key, res.rows);
    return res.rows;
}

// Reusable query widget: editor + Run button + status/meta/error + results table.
// When `referenceQuery` is provided (exercise mode), the user's result is
// compared against the reference answer and a Correct!/Wrong! verdict is shown.
export default function QueryRunner({ initialQuery = '', referenceQuery }) {
    const { getBase } = useServer();
    const [query, setQuery] = useState(initialQuery);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState(null);
    const [errorMark, setErrorMark] = useState(null);
    const [result, setResult] = useState(null);
    const [verdict, setVerdict] = useState(null);

    const handleChange = useCallback((value) => {
        setQuery(value);
        setErrorMark(null);
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
            setError(err.message);
            const position = parseErrorPosition(err.siloMessage);
            if (position) setErrorMark({ position, message: err.siloMessage });
        } finally {
            setRunning(false);
        }
    }, [query, referenceQuery, getBase]);

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
                {running && <span className='hint'>Running…</span>}
            </div>

            {verdict && <div className={`verdict ${verdict.status}`}>{verdict.message}</div>}

            {error && <div className='error'>{error}</div>}

            {result && (
                <>
                    <div className='meta'>
                        {result.rows.length} row{result.rows.length === 1 ? '' : 's'} · {result.executionMs} ms
                        execution + {result.downloadMs} ms download (= {result.elapsedMs} ms total)
                        {result.dataVersion ? ` · data-version ${result.dataVersion}` : ''}
                    </div>
                    <ResultsTable rows={result.rows} />
                </>
            )}
        </div>
    );
}
