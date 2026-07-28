import { useEffect, useMemo, useState } from 'react';
import { classifyColumns, sequenceUnit } from '../lib/sequences';
import SequenceViewer from './SequenceViewer';
import type { QueryRow, QueryValue, SequenceViewerState } from '../lib/types';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const MIN_COLUMN_WIDTH = 150;
const ROW_NUM_WIDTH = 48;
const HEADER_CHAR_WIDTH = 8.5; // approximate px per header character (used to size columns to the header)
const ALIGN_BUTTON_WIDTH = 46;
const CELL_CHAR_WIDTH = 7.3; // monospace px per character (cell values), used to decide when text overflows
const SEQUENCE_PREVIEW_CHARS = 80;

// Width of a column: enough to show its header on one line, but at least MIN_COLUMN_WIDTH.
function columnWidth(column: string, aligned: boolean) {
    const header = column.length * HEADER_CHAR_WIDTH + 24 + (aligned ? ALIGN_BUTTON_WIDTH : 0);
    return Math.max(MIN_COLUMN_WIDTH, Math.round(header));
}

type ColumnWidthState = {
    columnKey: string;
    widths: Record<string, number>;
};

type DragState = {
    column: string;
    startX: number;
    startWidth: number;
};

// Renders NDJSON result rows as a fixed-layout table: columns are sized to their header (min 150px),
// every cell is a single line, and content that doesn't fit is expanded on demand — strings via a
// more/less toggle, sequences via the viewer.
export default function ResultsTable({ rows }: { rows: QueryRow[] }) {
    const [viewer, setViewer] = useState<SequenceViewerState | null>(null);
    const [columnWidthState, setColumnWidthState] = useState<ColumnWidthState>({ columnKey: '', widths: {} });
    const [dragState, setDragState] = useState<DragState | null>(null);
    const data = rows ?? [];

    const columns = useMemo(() => {
        const set = new Set<string>();
        data.forEach((row) => Object.keys(row).forEach((key) => set.add(key)));
        return Array.from(set);
    }, [data]);
    const classified = useMemo(() => classifyColumns(data, columns), [data, columns]);
    const columnKey = useMemo(() => columns.join('\u0000'), [columns]);
    const widths = useMemo(() => {
        const adjustedWidths = columnWidthState.columnKey === columnKey ? columnWidthState.widths : {};
        return columns.map((column) => adjustedWidths[column] ?? columnWidth(column, classified[column].isAligned));
    }, [columnKey, columnWidthState, columns, classified]);

    useEffect(() => {
        if (!dragState) return;

        const move = (event: PointerEvent) => {
            const width = Math.max(
                MIN_COLUMN_WIDTH,
                Math.round(dragState.startWidth + event.clientX - dragState.startX),
            );
            setColumnWidthState((prev) => ({
                columnKey,
                widths: {
                    ...(prev.columnKey === columnKey ? prev.widths : {}),
                    [dragState.column]: width,
                },
            }));
        };

        const stop = () => setDragState(null);

        document.body.classList.add('column-resizing');
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', stop);
        window.addEventListener('pointercancel', stop);

        return () => {
            document.body.classList.remove('column-resizing');
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', stop);
            window.removeEventListener('pointercancel', stop);
        };
    }, [columnKey, dragState]);

    if (data.length === 0) return null;

    const tableWidth = ROW_NUM_WIDTH + widths.reduce((sum, width) => sum + width, 0);

    const openSingle = (column: string, row: QueryRow, index: number) => {
        const sequence = row[column];
        if (typeof sequence === 'string') {
            setViewer({ type: 'single', title: column, label: String(index + 1), sequence });
        }
    };

    const openAlignment = (column: string) =>
        setViewer({
            type: 'alignment',
            title: column,
            entries: data
                .map((row, index) => ({ label: String(index + 1), sequence: row[column] }))
                .filter((entry): entry is { label: string; sequence: string } => typeof entry.sequence === 'string'),
        });

    const startResize = (column: string, width: number, event: ReactPointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setDragState({ column, startX: event.clientX, startWidth: width });
    };

    const resizeByKeyboard = (column: string, width: number, event: ReactKeyboardEvent<HTMLButtonElement>) => {
        const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (direction === 0) return;

        event.preventDefault();
        setColumnWidthState((prev) => ({
            columnKey,
            widths: {
                ...(prev.columnKey === columnKey ? prev.widths : {}),
                [column]: Math.max(MIN_COLUMN_WIDTH, width + direction * 20),
            },
        }));
    };

    return (
        <>
            <div className='mt-3 max-w-full overflow-auto rounded-box border border-base-300'>
                <table className='table-pin-rows table table-fixed table-xs font-mono' style={{ width: tableWidth }}>
                    <colgroup>
                        <col style={{ width: ROW_NUM_WIDTH }} />
                        {columns.map((column, i) => (
                            <col key={column} style={{ width: widths[i] }} />
                        ))}
                    </colgroup>
                    <thead>
                        <tr>
                            <th className='bg-base-200 text-right font-sans text-base-content/60 select-none'>#</th>
                            {columns.map((column, i) => (
                                <th key={column} className='relative bg-base-200 font-sans'>
                                    <div className='flex items-baseline gap-1.5'>
                                        <span className='min-w-0 flex-1 truncate'>{column}</span>
                                        {classified[column].isAligned && (
                                            <button
                                                className='shrink-0 link text-xs font-normal link-primary'
                                                onClick={() => openAlignment(column)}
                                            >
                                                align
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        type='button'
                                        className='column-resize-handle'
                                        aria-label={`Resize ${column} column`}
                                        onPointerDown={(event) => startResize(column, widths[i], event)}
                                        onKeyDown={(event) => resizeByKeyboard(column, widths[i], event)}
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr className='border-b border-base-300 last:border-b-0 hover:bg-base-200/50' key={index}>
                                <td className='text-right text-base-content/60 select-none'>{index + 1}</td>
                                {columns.map((column, i) => (
                                    <Cell
                                        key={column}
                                        value={row[column]}
                                        isSequence={classified[column].isSequence}
                                        width={widths[i]}
                                        onView={() => openSingle(column, row, index)}
                                    />
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <SequenceViewer viewer={viewer} onClose={() => setViewer(null)} />
        </>
    );
}

type CellProps = {
    value: QueryValue | undefined;
    isSequence: boolean;
    width: number;
    onView: () => void;
};

function Cell({ value, isSequence, width, onView }: CellProps) {
    if (value === null || value === undefined) return <td className='text-base-content/35' />;
    if (typeof value === 'object') {
        return (
            <td>
                <div className='flex items-baseline gap-1.5'>
                    <span className='min-w-0 flex-1 truncate'>{JSON.stringify(value)}</span>
                </div>
            </td>
        );
    }
    if (isSequence && typeof value === 'string') {
        return (
            <td>
                <div className='flex items-baseline gap-1.5'>
                    <span className='min-w-0 flex-1 truncate'>{value.slice(0, SEQUENCE_PREVIEW_CHARS)}</span>
                    <span className='shrink-0 text-[11px] whitespace-nowrap text-base-content/60'>
                        {value.length.toLocaleString()} {sequenceUnit(value)}
                    </span>
                    <button className='shrink-0 link text-xs link-primary' onClick={onView}>
                        view
                    </button>
                </div>
            </td>
        );
    }
    const text = String(value);
    const fits = text.length <= Math.floor((width - 20) / CELL_CHAR_WIDTH);
    if (!fits) {
        return (
            <td>
                <ExpandableText value={text} />
            </td>
        );
    }
    return (
        <td>
            <div className='flex items-baseline gap-1.5'>
                <span className='min-w-0 flex-1 truncate'>{text}</span>
            </div>
        </td>
    );
}

function ExpandableText({ value }: { value: string }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className='flex items-baseline gap-1.5'>
            <span
                className={
                    expanded
                        ? 'min-w-0 flex-1 overflow-visible break-words whitespace-pre-wrap'
                        : 'min-w-0 flex-1 truncate'
                }
            >
                {value}
            </span>
            <button className='shrink-0 link text-xs link-primary' onClick={() => setExpanded((prev) => !prev)}>
                {expanded ? 'less' : 'more'}
            </button>
        </div>
    );
}
