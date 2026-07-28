import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { baseColorClass, sequenceUnit } from '../lib/sequences';
import MsaView from './MsaView';
import type { SequenceViewerState } from '../lib/types';

const MAX_COLOR_CELLS = 20000;
const LINE_WIDTH = 60;
const GROUP = 10;
const BASES = ['A', 'C', 'G', 'T', 'N', '-'];

// Renders a sequence into React nodes, grouping runs of the same base color into single spans so
// long sequences stay light on the DOM. Returns the plain string when coloring is off.
function renderColored(sequence: string, colorize: boolean): ReactNode {
    if (!colorize) return sequence;
    const nodes: ReactNode[] = [];
    let i = 0;
    while (i < sequence.length) {
        const cls = baseColorClass(sequence[i]);
        let j = i + 1;
        while (j < sequence.length && baseColorClass(sequence[j]) === cls) j++;
        const text = sequence.slice(i, j);
        nodes.push(
            cls ? (
                <span key={i} className={cls}>
                    {text}
                </span>
            ) : (
                text
            ),
        );
        i = j;
    }
    return nodes;
}

function BaseLegend() {
    return (
        <div className='flex gap-1.5 border-b border-base-300 px-4 py-2 font-mono text-xs'>
            {BASES.map((b) => (
                <span key={b} className={`badge badge-ghost badge-sm ${baseColorClass(b) ?? ''}`}>
                    {b === '-' ? 'gap' : b}
                </span>
            ))}
        </div>
    );
}

// A single sequence wrapped into fixed-width lines (groups of 10), each labeled with its 1-based
// start position — a GenBank-style layout that reads top-to-bottom with no horizontal scrolling.
function WrappedSequence({ sequence, colorize }: { sequence: string; colorize: boolean }) {
    const posWidth = String(sequence.length).length;
    const lines = [];
    for (let start = 0; start < sequence.length; start += LINE_WIDTH) {
        const text = sequence.slice(start, start + LINE_WIDTH);
        const blocks: ReactNode[] = [];
        for (let i = 0; i < text.length; i += GROUP) {
            if (i > 0) blocks.push(' ');
            blocks.push(<span key={i}>{renderColored(text.slice(i, i + GROUP), colorize)}</span>);
        }
        lines.push(
            <div className='flex' key={start}>
                <span
                    className='mr-[1.5ch] shrink-0 text-right text-base-content/60 select-none'
                    style={{ width: `${posWidth}ch` }}
                >
                    {start + 1}
                </span>
                <span className='whitespace-pre'>{blocks}</span>
            </div>,
        );
    }
    return <div className='font-mono text-xs leading-relaxed'>{lines}</div>;
}

// Modal overlay showing one sequence (wrapped, GenBank-style) or an aligned column across rows
// (an EBI Nightingale MSA viewer). Pass null to close.
export default function SequenceViewer({
    viewer,
    onClose,
}: {
    viewer: SequenceViewerState | null;
    onClose: () => void;
}) {
    useEffect(() => {
        if (!viewer) return undefined;
        document.body.classList.add('viewer-open');
        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.classList.remove('viewer-open');
            window.removeEventListener('keydown', onKey);
        };
    }, [viewer, onClose]);

    if (!viewer) return null;

    if (viewer.type === 'single') {
        const { sequence } = viewer;
        const colorize = sequenceUnit(sequence) === 'nt' && sequence.length <= MAX_COLOR_CELLS;
        return (
            <Overlay label={`${viewer.title} sequence viewer`} onClose={onClose}>
                <div className='flex flex-wrap items-center gap-3 border-b border-base-300 px-4 py-3'>
                    <strong className='text-sm'>{viewer.title}</strong>
                    <span className='mr-auto text-xs text-base-content/60'>
                        {viewer.label ? `row ${viewer.label} · ` : ''}
                        {sequence.length.toLocaleString()} {sequenceUnit(sequence)}
                    </span>
                    <button className='btn btn-outline btn-sm' onClick={onClose}>
                        Close
                    </button>
                </div>
                {colorize && <BaseLegend />}
                <div className='overflow-auto px-4 py-3'>
                    <WrappedSequence sequence={sequence} colorize={colorize} />
                </div>
            </Overlay>
        );
    }

    const length = viewer.entries.reduce((max, entry) => Math.max(max, entry.sequence.length), 0);
    return (
        <Overlay label={`${viewer.title} alignment viewer`} onClose={onClose}>
            <div className='flex flex-wrap items-center gap-3 border-b border-base-300 px-4 py-3'>
                <strong className='text-sm'>{viewer.title}</strong>
                <span className='mr-auto text-xs text-base-content/60'>
                    {viewer.entries.length} rows · {length.toLocaleString()} positions · drag the ruler to zoom
                </span>
                <a
                    className='link text-xs link-primary'
                    href='https://github.com/ebi-webcomponents/nightingale'
                    target='_blank'
                    rel='noreferrer'
                >
                    MSA viewer: Nightingale ↗
                </a>
                <button className='btn btn-outline btn-sm' onClick={onClose}>
                    Close
                </button>
            </div>
            <div className='overflow-auto px-4 py-3'>
                <MsaView entries={viewer.entries} />
            </div>
        </Overlay>
    );
}

function Overlay({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
    return createPortal(
        <div className='modal-open modal' role='dialog' aria-modal='true' aria-label={label} onMouseDown={onClose}>
            <div
                className='modal-box flex max-h-[85vh] w-11/12 max-w-6xl flex-col overflow-hidden p-0'
                onMouseDown={(event) => event.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}
