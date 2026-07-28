import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import QueryRunner from '../components/QueryRunner';
import { DEFAULT_CONSOLE_SERVER } from '../config';
import { runQuery } from '../lib/runQuery';
import { fetchSiloInfo, type SiloInfo } from '../lib/siloInfo';
import { buildConsoleShareUrl, normalizeServerUrl } from '../lib/serverUrl';
import { usePageMeta } from '../lib/pageMeta';
import type { QueryRow } from '../lib/types';
import { publicInstances, type PublicInstance } from '../data/publicInstances';

const STORAGE_KEY = 'silo-console-server';

type Connection = {
    server: string;
    info: SiloInfo;
    publicInstance?: PublicInstance;
};

type ConnectionMode = 'public' | 'custom';

type SchemaState =
    | { status: 'idle' | 'loading'; rows: QueryRow[]; error: null }
    | { status: 'ready'; rows: QueryRow[]; error: null }
    | { status: 'error'; rows: QueryRow[]; error: string };

export default function ConsolePage() {
    usePageMeta('Console', 'Connect a SILO instance, inspect its schema, and run SILO queries in the browser.');
    const sharedParams = new URLSearchParams(window.location.hash.slice(1));
    const sharedServer = sharedParams.get('server');
    const initialQuery = sharedParams.get('query') || '';
    const [serverInput, setServerInput] = useState(() => sharedServer || storedServer() || DEFAULT_CONSOLE_SERVER);
    const [connectionMode, setConnectionMode] = useState<ConnectionMode>(sharedServer ? 'custom' : 'public');
    const [selectedPublicId, setSelectedPublicId] = useState(publicInstances[0].id);
    const [connection, setConnection] = useState<Connection | null>(null);
    const [connecting, setConnecting] = useState(Boolean(sharedServer));
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [schema, setSchema] = useState<SchemaState>({ status: 'idle', rows: [], error: null });
    const [query, setQuery] = useState(initialQuery);
    const [linkCopied, setLinkCopied] = useState(false);
    const [autoRunSharedQuery, setAutoRunSharedQuery] = useState(Boolean(sharedServer && initialQuery.trim()));
    const sharedConnectionStarted = useRef(false);

    useEffect(() => {
        if (!linkCopied) return undefined;
        const timeout = window.setTimeout(() => setLinkCopied(false), 1800);
        return () => window.clearTimeout(timeout);
    }, [linkCopied]);

    const loadSchema = useCallback(async (server: string) => {
        setSchema({ status: 'loading', rows: [], error: null });
        try {
            const result = await runQuery(server, 'default.schema()');
            setSchema({ status: 'ready', rows: result.rows, error: null });
        } catch (error) {
            setSchema({
                status: 'error',
                rows: [],
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }, []);

    const connectTo = useCallback(
        async (serverValue: string, publicInstance?: PublicInstance) => {
            setConnecting(true);
            setConnectionError(null);
            setLinkCopied(false);
            try {
                const server = normalizeServerUrl(serverValue);
                const info = await fetchSiloInfo(server);
                setServerInput(server);
                setConnection({ server, info, publicInstance });
                localStorage.setItem(STORAGE_KEY, server);
                void loadSchema(server);
            } catch (error) {
                setConnection(null);
                setSchema({ status: 'idle', rows: [], error: null });
                setConnectionError(error instanceof Error ? error.message : String(error));
            } finally {
                setConnecting(false);
            }
        },
        [loadSchema],
    );

    useEffect(() => {
        if (!sharedServer || sharedConnectionStarted.current) return;
        sharedConnectionStarted.current = true;
        const publicInstance = publicInstances.find((instance) => instance.server === sharedServer);
        void connectTo(sharedServer, publicInstance);
    }, [connectTo, sharedServer]);

    const connectPublic = (event: FormEvent) => {
        event.preventDefault();
        const instance = publicInstances.find((item) => item.id === selectedPublicId) || publicInstances[0];
        void connectTo(instance.server, instance);
    };

    const connectCustom = (event: FormEvent) => {
        event.preventDefault();
        void connectTo(serverInput);
    };

    const selectMode = (mode: ConnectionMode) => {
        setConnectionMode(mode);
        setConnectionError(null);
    };

    const changeServer = () => {
        setConnection(null);
        setSchema({ status: 'idle', rows: [], error: null });
        setConnectionError(null);
        setLinkCopied(false);
    };

    const copyShareLink = async () => {
        if (!connection) return;
        const url = buildConsoleShareUrl(window.location.href, connection.server, query);
        try {
            await navigator.clipboard.writeText(url);
            setLinkCopied(true);
        } catch {
            setLinkCopied(false);
        }
    };

    return (
        <div className='console-page mx-auto w-full max-w-7xl px-4 py-8 lg:px-6 lg:py-10'>
            <h1 className='text-3xl font-bold tracking-tight'>Console</h1>

            <div className='mt-4 alert border-info/25 bg-info/8 px-3 py-2 text-sm'>
                <p className='text-base-content/65'>
                    <span className='font-semibold text-base-content'>Runs in your browser.</span> Queries and results
                    go only between your browser and the selected SILO instance; nothing is sent to us.
                </p>
            </div>

            {!connection ? (
                <section className='card mt-4 max-w-3xl border border-base-300 bg-base-100'>
                    <div className='card-body'>
                        <h2 className='card-title'>Choose an instance</h2>
                        <div
                            className='tabs-box mt-2 tabs grid w-full grid-cols-2 sm:w-fit'
                            role='tablist'
                            aria-label='Connection method'
                        >
                            <button
                                className={`tab ${connectionMode === 'public' ? 'tab-active' : ''}`}
                                type='button'
                                role='tab'
                                aria-selected={connectionMode === 'public'}
                                disabled={connecting}
                                onClick={() => selectMode('public')}
                            >
                                Public instances
                            </button>
                            <button
                                className={`tab ${connectionMode === 'custom' ? 'tab-active' : ''}`}
                                type='button'
                                role='tab'
                                aria-selected={connectionMode === 'custom'}
                                disabled={connecting}
                                onClick={() => selectMode('custom')}
                            >
                                Custom URL
                            </button>
                        </div>

                        {connectionMode === 'public' ? (
                            <PublicInstanceForm
                                selectedId={selectedPublicId}
                                connecting={connecting}
                                onSelect={setSelectedPublicId}
                                onSubmit={connectPublic}
                            />
                        ) : (
                            <CustomServerForm
                                server={serverInput}
                                connecting={connecting}
                                onServerChange={setServerInput}
                                onSubmit={connectCustom}
                            />
                        )}

                        {connectionError && (
                            <div className='mt-2 alert border-error/25 bg-error/8 text-sm text-error' role='alert'>
                                {connectionError}
                            </div>
                        )}
                        <p className='mt-2 text-xs text-base-content/50'>
                            The selected address is stored only in this browser.
                        </p>
                    </div>
                </section>
            ) : (
                <>
                    <section className='mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-box border border-success/25 bg-success/8 px-3 py-2'>
                        <div className='flex w-full min-w-0 flex-none flex-col items-start gap-x-3 gap-y-1 sm:w-auto sm:flex-1 sm:flex-row sm:items-center'>
                            <div className='flex shrink-0 items-center gap-2 font-semibold text-success'>
                                <span className='status status-success' /> Connected
                            </div>
                            <div
                                className='w-full min-w-0 flex-1 truncate text-sm text-base-content/65'
                                title={connection.server}
                            >
                                {connection.publicInstance ? (
                                    <>
                                        {connection.publicInstance.name} · hosted by{' '}
                                        {connection.publicInstance.hostedBy}
                                    </>
                                ) : (
                                    connection.server
                                )}
                            </div>
                        </div>
                        <dl className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
                            <div className='flex items-baseline gap-1.5'>
                                <dt className='text-base-content/50'>Sequences</dt>
                                <dd className='font-semibold'>{connection.info.sequenceCount.toLocaleString()}</dd>
                            </div>
                            <div className='flex items-baseline gap-1.5'>
                                <dt className='text-base-content/50'>Version</dt>
                                <dd className='font-mono font-semibold' title={connection.info.version}>
                                    {shortVersion(connection.info.version)}
                                </dd>
                            </div>
                        </dl>
                        <button className='btn btn-outline btn-sm' type='button' onClick={changeServer}>
                            Change server
                        </button>
                    </section>

                    <details className='collapse mt-3 border border-base-300 bg-base-100'>
                        <summary className='collapse-title font-semibold'>Instance schema</summary>
                        <div className='collapse-content'>
                            {schema.status === 'loading' && (
                                <div
                                    className='flex items-center gap-2 py-3 text-sm text-base-content/60'
                                    role='status'
                                >
                                    <span className='loading loading-sm loading-spinner' /> Loading schema…
                                </div>
                            )}
                            {schema.status === 'error' && (
                                <div className='alert border-error/25 bg-error/8 text-sm text-error' role='alert'>
                                    The instance connected, but its schema could not be loaded. {schema.error}
                                </div>
                            )}
                            {schema.status === 'ready' && <SchemaTable rows={schema.rows} />}
                        </div>
                    </details>

                    <section className='mt-5'>
                        <div className='mb-3 flex flex-wrap items-end justify-between gap-3'>
                            <div>
                                <h2 className='text-2xl font-bold tracking-tight'>Query</h2>
                                <p className='mt-1 text-sm text-base-content/60'>
                                    A <code>.limit(100)</code> is added when the query does not set a limit.
                                </p>
                            </div>
                            <div
                                className='tooltip tooltip-bottom tooltip-end'
                                data-tip='The link includes the server URL and query in its browser-only fragment'
                            >
                                <button className='btn btn-outline btn-sm' type='button' onClick={copyShareLink}>
                                    {linkCopied ? 'Link copied' : 'Copy share link'}
                                </button>
                            </div>
                        </div>
                        <QueryRunner
                            server={connection.server}
                            initialQuery={initialQuery}
                            onQueryChange={setQuery}
                            autoRun={autoRunSharedQuery}
                            onAutoRun={() => setAutoRunSharedQuery(false)}
                        />
                    </section>
                </>
            )}
        </div>
    );
}

function PublicInstanceForm({
    selectedId,
    connecting,
    onSelect,
    onSubmit,
}: {
    selectedId: string;
    connecting: boolean;
    onSelect: (id: string) => void;
    onSubmit: (event: FormEvent) => void;
}) {
    return (
        <form className='mt-4' onSubmit={onSubmit}>
            <fieldset className='min-w-0'>
                <legend className='mb-2 text-sm font-medium'>Public SILO instances</legend>
                <div className='overflow-hidden rounded-box border border-base-300'>
                    {publicInstances.map((instance) => (
                        <label
                            className='flex cursor-pointer items-start gap-3 border-b border-base-300 p-4 last:border-b-0 hover:bg-base-200/60'
                            key={instance.id}
                        >
                            <input
                                className='radio mt-0.5 radio-sm radio-primary'
                                type='radio'
                                name='public-instance'
                                value={instance.id}
                                checked={selectedId === instance.id}
                                onChange={() => onSelect(instance.id)}
                            />
                            <span className='min-w-0'>
                                <span className='block font-semibold'>{instance.name}</span>
                                <span className='block text-sm text-base-content/60'>
                                    Hosted by {instance.hostedBy}
                                </span>
                                <span className='mt-1 block truncate font-mono text-xs text-base-content/45'>
                                    {instance.server}
                                </span>
                            </span>
                        </label>
                    ))}
                </div>
            </fieldset>
            <ConnectButton connecting={connecting} />
        </form>
    );
}

function CustomServerForm({
    server,
    connecting,
    onServerChange,
    onSubmit,
}: {
    server: string;
    connecting: boolean;
    onServerChange: (server: string) => void;
    onSubmit: (event: FormEvent) => void;
}) {
    return (
        <form className='mt-4' onSubmit={onSubmit}>
            <p className='text-sm text-base-content/65'>
                Enter the base URL immediately before the <code>/info</code> and <code>/query</code> endpoints. The
                instance must allow requests from this site through its CORS policy.
            </p>
            <label className='form-control mt-4 w-full'>
                <span className='label-text mb-2 font-medium'>SILO server URL</span>
                <input
                    className='input w-full'
                    type='url'
                    required
                    spellCheck={false}
                    value={server}
                    placeholder='https://silo.example.org'
                    onChange={(event) => onServerChange(event.target.value)}
                />
            </label>
            <ConnectButton connecting={connecting} />
        </form>
    );
}

function ConnectButton({ connecting }: { connecting: boolean }) {
    return (
        <div className='mt-4 card-actions justify-start'>
            <button className='btn btn-primary' type='submit' disabled={connecting}>
                {connecting && <span className='loading loading-sm loading-spinner' />}
                {connecting ? 'Connecting…' : 'Connect'}
            </button>
        </div>
    );
}

function SchemaTable({ rows }: { rows: QueryRow[] }) {
    return (
        <div className='max-h-96 overflow-auto rounded-box border border-base-300'>
            <table className='table-pin-rows table table-sm'>
                <thead>
                    <tr>
                        <th className='bg-base-200'>Field</th>
                        <th className='bg-base-200'>Type</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={`${String(row.fieldName)}-${index}`}>
                            <td>
                                <code>{String(row.fieldName)}</code>
                            </td>
                            <td>
                                <code>{String(row.type)}</code>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function storedServer() {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
}

function shortVersion(version: string) {
    return version.length > 12 ? version.slice(0, 10) : version;
}
