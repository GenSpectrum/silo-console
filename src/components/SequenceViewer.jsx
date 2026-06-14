import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { baseColorClass, sequenceUnit } from '../lib/sequences.js';
import MsaView from './MsaView.jsx';

const MAX_COLOR_CELLS = 20000;
const LINE_WIDTH = 60;
const GROUP = 10;
const BASES = ['A', 'C', 'G', 'T', 'N', '-'];

// Renders a sequence into React nodes, grouping runs of the same base color into single spans so
// long sequences stay light on the DOM. Returns the plain string when coloring is off.
function renderColored(sequence, colorize) {
    if (!colorize) return sequence;
    const nodes = [];
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
        <div className='seq-legend'>
            {BASES.map((b) => (
                <span key={b} className={baseColorClass(b)}>
                    {b === '-' ? 'gap' : b}
                </span>
            ))}
        </div>
    );
}

// A single sequence wrapped into fixed-width lines (groups of 10), each labeled with its 1-based
// start position — a GenBank-style layout that reads top-to-bottom with no horizontal scrolling.
function WrappedSequence({ sequence, colorize }) {
    const posWidth = String(sequence.length).length;
    const lines = [];
    for (let start = 0; start < sequence.length; start += LINE_WIDTH) {
        const text = sequence.slice(start, start + LINE_WIDTH);
        const blocks = [];
        for (let i = 0; i < text.length; i += GROUP) {
            if (i > 0) blocks.push(' ');
            blocks.push(<span key={i}>{renderColored(text.slice(i, i + GROUP), colorize)}</span>);
        }
        lines.push(
            <div className='seq-wrap-line' key={start}>
                <span className='seq-pos' style={{ width: `${posWidth}ch` }}>
                    {start + 1}
                </span>
                <span className='seq-bases'>{blocks}</span>
            </div>,
        );
    }
    return <div className='seq-wrap'>{lines}</div>;
}

// Modal overlay showing one sequence (wrapped, GenBank-style) or an aligned column across rows
// (an EBI Nightingale MSA viewer). Pass null to close.
export default function SequenceViewer({ viewer, onClose }) {
    useEffect(() => {
        if (!viewer) return undefined;
        document.body.classList.add('viewer-open');
        const onKey = (event) => event.key === 'Escape' && onClose();
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
            <Overlay onClose={onClose}>
                <div className='seq-head'>
                    <strong>{viewer.title}</strong>
                    <span className='hint'>
                        {viewer.label ? `row ${viewer.label} · ` : ''}
                        {sequence.length.toLocaleString()} {sequenceUnit(sequence)}
                    </span>
                    <button className='secondary' onClick={onClose}>
                        Close
                    </button>
                </div>
                {colorize && <BaseLegend />}
                <div className='seq-scroll'>
                    <WrappedSequence sequence={sequence} colorize={colorize} />
                </div>
            </Overlay>
        );
    }

    const length = viewer.entries.reduce((max, entry) => Math.max(max, entry.sequence.length), 0);
    return (
        <Overlay onClose={onClose}>
            <div className='seq-head'>
                <strong>{viewer.title}</strong>
                <span className='hint'>
                    {viewer.entries.length} rows · {length.toLocaleString()} positions · drag the ruler to zoom
                </span>
                <a
                    className='msa-credit'
                    href='https://github.com/ebi-webcomponents/nightingale'
                    target='_blank'
                    rel='noreferrer'
                >
                    MSA viewer: Nightingale ↗
                </a>
                <button className='secondary' onClick={onClose}>
                    Close
                </button>
            </div>
            <div className='seq-scroll'>
                <MsaView entries={viewer.entries} />
            </div>
        </Overlay>
    );
}

function Overlay({ onClose, children }) {
    return createPortal(
        <div className='seq-overlay' onMouseDown={onClose}>
            <div className='seq-panel' onMouseDown={(event) => event.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body,
    );
}
