import { type ChangeEvent, type SyntheticEvent, useEffect, useRef, useState } from 'react';
import { LocalRhyDBClient } from '../lib/localRhyDBClient';
import { validateRawBundle, type RawBundleValidation } from '../lib/localRhyDBFiles';
import type { LocalRhyDBEvent, LocalRhyDBProgress } from '../lib/localRhyDBProtocol';
import type { RhyDBInfo } from '../lib/rhydbInfo';

type LocalDataSetupProps = {
    onReady(client: LocalRhyDBClient, info: RhyDBInfo, canDownloadState: boolean): void;
};

type SourceMode = 'raw' | 'state';

export default function LocalDataSetup({ onReady }: LocalDataSetupProps) {
    const [sourceMode, setSourceMode] = useState<SourceMode>('raw');
    const [configFile, setConfigFile] = useState<File | null>(null);
    const [inputFiles, setInputFiles] = useState<File[]>([]);
    const [stateFile, setStateFile] = useState<File | null>(null);
    const [validation, setValidation] = useState<RawBundleValidation | null>(null);
    const [progress, setProgress] = useState<LocalRhyDBProgress | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [running, setRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const clientRef = useRef<LocalRhyDBClient | null>(null);
    const supported = window.crossOriginIsolated === true && typeof Worker !== 'undefined' && 'WebAssembly' in window;

    useEffect(() => {
        if (!running) return undefined;
        const startedAt = Date.now();
        setElapsedSeconds(0);
        const interval = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
        return () => window.clearInterval(interval);
    }, [running]);

    useEffect(
        () => () => {
            clientRef.current?.dispose();
        },
        [],
    );

    const selectSourceMode = (mode: SourceMode) => {
        setSourceMode(mode);
        setValidation(null);
        setError(null);
    };

    const addInputFiles = (event: ChangeEvent<HTMLInputElement>) => {
        const added = [...(event.target.files || [])];
        setInputFiles((current) => [...current, ...added]);
        setValidation(null);
        setError(null);
        event.target.value = '';
    };

    const updateConfigFile = (event: ChangeEvent<HTMLInputElement>) => {
        setConfigFile(event.target.files?.[0] || null);
        setValidation(null);
        setError(null);
    };

    const updateStateFile = (event: ChangeEvent<HTMLInputElement>) => {
        setStateFile(event.target.files?.[0] || null);
        setError(null);
    };

    const handleEvent = (event: LocalRhyDBEvent) => {
        if (event.type === 'progress') {
            setProgress(event.value);
        } else {
            setLogs((current) => [...current.slice(-499), event.message]);
        }
    };

    const preprocess = async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!configFile || running) return;
        const result = await validateRawBundle(configFile, inputFiles);
        setValidation(result);
        if (!result.ok) return;

        const client = new LocalRhyDBClient();
        clientRef.current = client;
        setRunning(true);
        setError(null);
        setLogs([]);
        try {
            const info = await client.preprocess(result.normalizedConfig, result.files, handleEvent);
            clientRef.current = null;
            onReady(client, info, true);
        } catch (operationError) {
            client.dispose();
            clientRef.current = null;
            if (!(operationError instanceof DOMException && operationError.name === 'AbortError')) {
                setError(errorMessage(operationError));
            }
        } finally {
            setRunning(false);
        }
    };

    const loadState = async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!stateFile || running) return;
        const client = new LocalRhyDBClient();
        clientRef.current = client;
        setRunning(true);
        setError(null);
        setLogs([]);
        try {
            const info = await client.loadState(stateFile, handleEvent);
            clientRef.current = null;
            onReady(client, info, false);
        } catch (operationError) {
            client.dispose();
            clientRef.current = null;
            if (!(operationError instanceof DOMException && operationError.name === 'AbortError')) {
                setError(errorMessage(operationError));
            }
        } finally {
            setRunning(false);
        }
    };

    const cancel = () => {
        clientRef.current?.cancel();
        setProgress(null);
    };

    return (
        <div className='mt-4'>
            {!supported && (
                <div className='alert border-error/25 bg-error/8 text-sm text-error' role='alert'>
                    Local RhyDB needs a cross-origin-isolated page with WebAssembly and worker support. Ask the site
                    administrator to enable the required COOP and COEP response headers.
                </div>
            )}

            <p className='text-sm text-base-content/65'>
                Files, preprocessing, queries, and results stay on this device. Closing or reloading this tab clears the
                local database.
            </p>

            <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                <SourceCard
                    title='Prepare raw data'
                    description='Run RhyDB preprocessing on an input bundle.'
                    selected={sourceMode === 'raw'}
                    disabled={running}
                    onClick={() => selectSourceMode('raw')}
                />
                <SourceCard
                    title='Open processed state'
                    description='Skip preprocessing and open a RhyDB state ZIP.'
                    selected={sourceMode === 'state'}
                    disabled={running}
                    onClick={() => selectSourceMode('state')}
                />
            </div>

            {sourceMode === 'raw' ? (
                <form className='mt-5' onSubmit={preprocess}>
                    <label className='form-control w-full'>
                        <span className='label-text mb-2 font-medium'>Preprocessing configuration</span>
                        <input
                            className='file-input w-full'
                            type='file'
                            accept='.yaml,.yml,application/yaml,text/yaml'
                            disabled={!supported || running}
                            onChange={updateConfigFile}
                        />
                    </label>

                    <div className='mt-4'>
                        <div className='flex flex-wrap items-center justify-between gap-2'>
                            <div>
                                <div className='text-sm font-medium'>Referenced input files</div>
                                <p className='mt-1 text-xs text-base-content/50'>
                                    Add the NDJSON, database configuration, reference genome, and optional files. You
                                    can add several selections.
                                </p>
                            </div>
                            <label className={`btn btn-outline btn-sm ${!supported || running ? 'btn-disabled' : ''}`}>
                                Add files
                                <input
                                    className='sr-only'
                                    type='file'
                                    multiple
                                    disabled={!supported || running}
                                    onChange={addInputFiles}
                                />
                            </label>
                        </div>
                        <SelectedFiles files={inputFiles} disabled={running} onRemove={(index) => removeFile(index)} />
                    </div>

                    {validation?.exceedsTargetSize && <SizeWarning totalBytes={validation.totalBytes} />}
                    {!validation && configFile && totalSize(configFile, inputFiles) > 500 * 1024 * 1024 && (
                        <SizeWarning totalBytes={totalSize(configFile, inputFiles)} />
                    )}
                    {validation && !validation.ok && <ValidationError validation={validation} />}

                    <div className='mt-5 flex flex-wrap items-center gap-2'>
                        <button
                            className='btn btn-primary'
                            type='submit'
                            disabled={!supported || !configFile || inputFiles.length === 0 || running}
                        >
                            {running && <span className='loading loading-sm loading-spinner' />}
                            {running ? 'Preparing…' : 'Check and preprocess'}
                        </button>
                        {running && (
                            <button className='btn btn-outline' type='button' onClick={cancel}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            ) : (
                <form className='mt-5' onSubmit={loadState}>
                    <label className='form-control w-full'>
                        <span className='label-text mb-2 font-medium'>Processed RhyDB state ZIP</span>
                        <input
                            className='file-input w-full'
                            type='file'
                            accept='.zip,application/zip'
                            disabled={!supported || running}
                            onChange={updateStateFile}
                        />
                    </label>
                    <div className='mt-5 flex flex-wrap items-center gap-2'>
                        <button
                            className='btn btn-primary'
                            type='submit'
                            disabled={!supported || !stateFile || running}
                        >
                            {running && <span className='loading loading-sm loading-spinner' />}
                            {running ? 'Opening…' : 'Open state'}
                        </button>
                        {running && (
                            <button className='btn btn-outline' type='button' onClick={cancel}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            )}

            {progress && (running || logs.length > 0) && (
                <ProgressPanel progress={progress} elapsedSeconds={elapsedSeconds} logs={logs} running={running} />
            )}
            {error && (
                <div className='mt-4 alert border-error/25 bg-error/8 text-sm text-error' role='alert'>
                    <span className='whitespace-pre-wrap'>{error}</span>
                </div>
            )}
        </div>
    );

    function removeFile(index: number) {
        setInputFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
        setValidation(null);
        setError(null);
    }
}

function SourceCard({
    title,
    description,
    selected,
    disabled,
    onClick,
}: {
    title: string;
    description: string;
    selected: boolean;
    disabled: boolean;
    onClick(): void;
}) {
    return (
        <button
            className={`rounded-box border p-4 text-left transition-colors ${
                selected ? 'border-primary bg-primary/8' : 'border-base-300 hover:bg-base-200/60'
            }`}
            type='button'
            aria-pressed={selected}
            disabled={disabled}
            onClick={onClick}
        >
            <span className='block font-semibold'>{title}</span>
            <span className='mt-1 block text-sm text-base-content/60'>{description}</span>
        </button>
    );
}

function SelectedFiles({
    files,
    disabled,
    onRemove,
}: {
    files: File[];
    disabled: boolean;
    onRemove(index: number): void;
}) {
    if (!files.length) {
        return (
            <div className='mt-3 rounded-box border border-dashed border-base-300 p-4 text-sm text-base-content/45'>
                No input files selected yet.
            </div>
        );
    }
    return (
        <div className='mt-3 max-h-56 overflow-auto rounded-box border border-base-300'>
            <ul className='divide-y divide-base-300'>
                {files.map((file, index) => (
                    <li className='flex items-center gap-3 px-3 py-2 text-sm' key={`${file.name}-${index}`}>
                        <span className='min-w-0 flex-1 truncate font-mono text-xs' title={file.name}>
                            {file.name}
                        </span>
                        <span className='shrink-0 text-xs text-base-content/45'>{formatBytes(file.size)}</span>
                        <button
                            className='btn btn-ghost btn-xs'
                            type='button'
                            aria-label={`Remove ${file.name}`}
                            disabled={disabled}
                            onClick={() => onRemove(index)}
                        >
                            Remove
                        </button>
                    </li>
                ))}
            </ul>
            <div className='border-t border-base-300 bg-base-200/50 px-3 py-2 text-right text-xs text-base-content/55'>
                {files.length} file{files.length === 1 ? '' : 's'} ·{' '}
                {formatBytes(files.reduce((sum, file) => sum + file.size, 0))}
            </div>
        </div>
    );
}

function ValidationError({ validation }: { validation: Extract<RawBundleValidation, { ok: false }> }) {
    return (
        <div className='mt-4 alert items-start border-error/25 bg-error/8 text-sm text-error' role='alert'>
            <div>
                <div>{validation.message}</div>
                {validation.missingFiles && (
                    <ul className='mt-2 list-inside list-disc font-mono text-xs'>
                        {validation.missingFiles.map((filename) => (
                            <li key={filename}>{filename}</li>
                        ))}
                    </ul>
                )}
                {validation.duplicateFiles && (
                    <ul className='mt-2 list-inside list-disc font-mono text-xs'>
                        {validation.duplicateFiles.map((filename) => (
                            <li key={filename}>{filename}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function SizeWarning({ totalBytes }: { totalBytes: number }) {
    return (
        <div className='mt-4 alert border-warning/30 bg-warning/10 text-sm' role='status'>
            The selected files total {formatBytes(totalBytes)}. Datasets above 500 MB may exceed browser memory after
            RhyDB builds its indexes.
        </div>
    );
}

function ProgressPanel({
    progress,
    elapsedSeconds,
    logs,
    running,
}: {
    progress: LocalRhyDBProgress;
    elapsedSeconds: number;
    logs: string[];
    running: boolean;
}) {
    const percentage =
        progress.totalBytes && progress.completedBytes !== undefined
            ? Math.min(100, Math.round((progress.completedBytes / progress.totalBytes) * 100))
            : null;
    return (
        <div className='mt-4 rounded-box border border-info/25 bg-info/8 p-4' role='status'>
            <div className='flex items-center gap-2 text-sm font-semibold'>
                {running && <span className='loading loading-sm loading-spinner' />} {progress.message}
            </div>
            <div className='mt-1 text-xs text-base-content/55'>Elapsed: {formatElapsed(elapsedSeconds)}</div>
            {percentage !== null && (
                <progress className='progress mt-3 w-full progress-info' value={percentage} max='100' />
            )}
            {logs.length > 0 && (
                <details className='mt-3'>
                    <summary className='cursor-pointer text-xs font-semibold'>RhyDB logs</summary>
                    <pre className='mt-2 max-h-48 overflow-auto rounded-box bg-neutral p-3 font-mono text-xs whitespace-pre-wrap text-neutral-content'>
                        {logs.join('\n')}
                    </pre>
                </details>
            )}
        </div>
    );
}

function totalSize(configFile: File, files: File[]) {
    return configFile.size + files.reduce((sum, file) => sum + file.size, 0);
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatElapsed(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    return minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}
