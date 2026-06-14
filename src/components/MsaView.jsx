import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import NightingaleManager from '@nightingale-elements/nightingale-manager';
import NightingaleNavigation from '@nightingale-elements/nightingale-navigation';
import NightingaleMsa from '@nightingale-elements/nightingale-msa';
import { sequenceUnit } from '../lib/sequences.js';

const LABEL_WIDTH = 56;
const TILE_HEIGHT = 20;
const MAX_ROWS = 200;
const INITIAL_COLUMNS = 60;
const NIGHTINGALE_ELEMENTS = [NightingaleManager, NightingaleNavigation, NightingaleMsa];

// Wraps EBI's <nightingale-msa> web component: a canvas multiple-sequence-alignment viewer with a
// zoomable navigation ruler. Rows are labelled by their result-table row number. Data is pushed onto
// the element via a ref (web components take complex values as properties), and width tracks the
// container.
export default function MsaView({ entries }) {
    const containerRef = useRef(null);
    const msaRef = useRef(null);
    const [width, setWidth] = useState(0);
    const elementsRegistered = NIGHTINGALE_ELEMENTS.every((elementClass) => typeof elementClass === 'function');

    const shown = entries.slice(0, MAX_ROWS);
    const length = shown.reduce((max, entry) => Math.max(max, entry.sequence.length), 0);
    const colorScheme = sequenceUnit(shown[0].sequence) === 'nt' ? 'nucleotide' : 'clustal';
    const displayEnd = Math.min(length, INITIAL_COLUMNS);
    const height = shown.length * TILE_HEIGHT;

    useLayoutEffect(() => {
        const element = containerRef.current;
        if (!element) return undefined;
        const update = () => setWidth(element.clientWidth);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const element = msaRef.current;
        if (!element) return undefined;
        let active = true;
        const sequences = shown.map((entry) => ({ name: entry.label, sequence: entry.sequence }));
        // The data setter writes to an internal viewer that only exists after the element's first
        // render, so wait for updateComplete before assigning.
        Promise.resolve(element.updateComplete).then(() => {
            if (active) element.data = sequences;
        });
        return () => {
            active = false;
        };
    }, [shown, width]);

    return (
        <div className='msa-container' ref={containerRef}>
            {width > 0 && elementsRegistered && (
                <nightingale-manager>
                    <nightingale-navigation
                        height='40'
                        length={length}
                        width={width}
                        display-start='1'
                        display-end={displayEnd}
                        margin-left={LABEL_WIDTH}
                    />
                    <nightingale-msa
                        ref={msaRef}
                        length={length}
                        width={width}
                        height={height}
                        label-width={LABEL_WIDTH}
                        color-scheme={colorScheme}
                        display-start='1'
                        display-end={displayEnd}
                    />
                </nightingale-manager>
            )}
        </div>
    );
}
