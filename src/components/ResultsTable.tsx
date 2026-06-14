import { useMemo, useState } from 'react';
import { classifyColumns, sequenceUnit } from '../lib/sequences';
import SequenceViewer from './SequenceViewer';
import type { QueryRow, QueryValue, SequenceViewerState } from '../lib/types';

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

// Renders NDJSON result rows as a fixed-layout table: columns are sized to their header (min 150px),
// every cell is a single line, and content that doesn't fit is expanded on demand — strings via a
// more/less toggle, sequences via the viewer.
export default function ResultsTable({ rows }: { rows: QueryRow[] }) {
    const [viewer, setViewer] = useState<SequenceViewerState | null>(null);
    const data = rows ?? [];

    const columns = useMemo(() => {
        const set = new Set<string>();
        data.forEach((row) => Object.keys(row).forEach((key) => set.add(key)));
        return Array.from(set);
    }, [data]);
    const classified = useMemo(() => classifyColumns(data, columns), [data, columns]);
    const widths = useMemo(
        () => columns.map((column) => columnWidth(column, classified[column].isAligned)),
        [columns, classified],
    );

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

    return (
        <>
            <div className='table-wrap'>
                <table style={{ width: tableWidth }}>
                    <colgroup>
                        <col style={{ width: ROW_NUM_WIDTH }} />
                        {columns.map((column, i) => (
                            <col key={column} style={{ width: widths[i] }} />
                        ))}
                    </colgroup>
                    <thead>
                        <tr>
                            <th className='row-num'>#</th>
                            {columns.map((column) => (
                                <th key={column}>
                                    <div className='cell'>
                                        <span className='trunc'>{column}</span>
                                        {classified[column].isAligned && (
                                            <button className='link-btn' onClick={() => openAlignment(column)}>
                                                align
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index}>
                                <td className='row-num'>{index + 1}</td>
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
    if (value === null || value === undefined) return <td className='null-value' />;
    if (typeof value === 'object') {
        return (
            <td>
                <div className='cell'>
                    <span className='trunc'>{JSON.stringify(value)}</span>
                </div>
            </td>
        );
    }
    if (isSequence && typeof value === 'string') {
        return (
            <td>
                <div className='cell'>
                    <span className='trunc'>{value.slice(0, SEQUENCE_PREVIEW_CHARS)}</span>
                    <span className='seq-meta'>
                        {value.length.toLocaleString()} {sequenceUnit(value)}
                    </span>
                    <button className='link-btn' onClick={onView}>
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
            <div className='cell'>
                <span className='trunc'>{text}</span>
            </div>
        </td>
    );
}

function ExpandableText({ value }: { value: string }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className={expanded ? 'cell expanded' : 'cell'}>
            <span className='trunc'>{value}</span>
            <button className='link-btn' onClick={() => setExpanded((prev) => !prev)}>
                {expanded ? 'less' : 'more'}
            </button>
        </div>
    );
}
