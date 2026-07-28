import { type FormEvent, useCallback, useEffect, useState } from 'react';
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
    const [connecting, setConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [schema, setSchema] = useState<SchemaState>({ status: 'idle', rows: [], error: null });
    const [query, setQuery] = useState(initialQuery);
    const [linkCopied, setLinkCopied] = useState(false);

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

    const connectTo = async (serverValue: string, publicInstance?: PublicInstance) => {
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
    };

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
            <div className='max-w-3xl'>
                <h1 className='text-3xl font-bold tracking-tight'>Console</h1>
                <p className='mt-3 text-base leading-relaxed text-base-content/65'>
                    Query a listed public SILO instance or connect another instance by URL.
                </p>
            </div>

            <div className='mt-5 alert max-w-3xl items-start border-info/25 bg-info/8 text-sm'>
                <span className='text-info'>●</span>
                <div>
                    <div className='font-semibold'>This Console runs in your browser</div>
                    <p className='mt-0.5 text-base-content/65'>
                        This site has no application backend. Queries are sent directly to the SILO instance you select;
                        we do not receive your server address, queries, or results.
                    </p>
                </div>
            </div>

            {!connection ? (
                <section className='card mt-7 max-w-3xl border border-base-300 bg-base-100'>
                    <div className='card-body'>
                        <h2 className='card-title'>Choose an instance</h2>
                        <div className='tabs-box mt-2 tabs w-fit' role='tablist' aria-label='Connection method'>
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
                                sharedServer={sharedServer}
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
                            The selected address is stored only in this browser. Query data is not sent to us.
                        </p>
                    </div>
                </section>
            ) : (
                <>
                    <section className='mt-7 flex flex-wrap items-center gap-4 rounded-box border border-success/25 bg-success/8 px-4 py-3'>
                        <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-2 font-semibold text-success'>
                                <span className='status status-success' /> Connected
                            </div>
                            <div className='mt-1 truncate text-sm text-base-content/65' title={connection.server}>
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
                        <div className='stats bg-transparent shadow-none'>
                            <div className='stat px-3 py-0'>
                                <div className='stat-title text-xs'>Sequences</div>
                                <div className='stat-value text-lg'>
                                    {connection.info.sequenceCount.toLocaleString()}
                                </div>
                            </div>
                            <div className='stat px-3 py-0'>
                                <div className='stat-title text-xs'>Version</div>
                                <div className='stat-value font-mono text-sm' title={connection.info.version}>
                                    {shortVersion(connection.info.version)}
                                </div>
                            </div>
                        </div>
                        <button className='btn btn-outline btn-sm' type='button' onClick={changeServer}>
                            Change server
                        </button>
                    </section>

                    <details className='collapse mt-5 border border-base-300 bg-base-100'>
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

                    <section className='mt-8'>
                        <div className='mb-4 flex flex-wrap items-end justify-between gap-3'>
                            <div>
                                <h2 className='text-2xl font-bold tracking-tight'>Query</h2>
                                <p className='mt-1 text-sm text-base-content/60'>
                                    Queries and results stay between this browser and the connected SILO instance. A{' '}
                                    <code>.limit(100)</code> is added when the query does not set a limit.
                                </p>
                            </div>
                            <div
                                className='tooltip tooltip-left'
                                data-tip='The browser-only URL fragment includes the server URL and query'
                            >
                                <button className='btn btn-outline btn-sm' type='button' onClick={copyShareLink}>
                                    {linkCopied ? 'Link copied' : 'Copy share link'}
                                </button>
                            </div>
                        </div>
                        <QueryRunner server={connection.server} initialQuery={initialQuery} onQueryChange={setQuery} />
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
            <fieldset>
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
    sharedServer,
    connecting,
    onServerChange,
    onSubmit,
}: {
    server: string;
    sharedServer: string | null;
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
            {sharedServer && (
                <div className='mt-3 alert border-warning/25 bg-warning/8 py-3 text-sm'>
                    This server address came from the shared page URL. Check it before connecting.
                </div>
            )}
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
