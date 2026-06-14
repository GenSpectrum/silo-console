import { useEffect, useMemo, useRef } from 'react';
import CodeMirror, { keymap, Prec } from '@uiw/react-codemirror';
import { setDiagnostics } from '@codemirror/lint';
import { toggleLineComment } from '@codemirror/commands';
import { saneql } from '../lib/saneql.js';
import { diagnosticFor } from '../lib/diagnostic.js';

// CodeMirror editor for SaneQL. Ctrl/Cmd+Enter runs the query, Ctrl/Cmd+/ toggles comments, and an
// `errorPosition` highlights the offending character with `errorMessage` on hover.
export default function QueryEditor({
    value,
    onChange,
    onRun,
    status,
    errorPosition,
    errorMessage,
    minHeight = '160px',
}) {
    const viewRef = useRef(null);

    const extensions = useMemo(
        () => [
            saneql(),
            // Prec.highest beats basicSetup's default Mod-Enter binding (insert blank line).
            Prec.highest(
                keymap.of([
                    {
                        key: 'Mod-Enter',
                        preventDefault: true,
                        run: () => {
                            onRun?.();
                            return true;
                        },
                    },
                    { key: 'Mod-/', preventDefault: true, run: toggleLineComment },
                ]),
            ),
        ],
        [onRun],
    );

    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        const diagnostics = errorPosition
            ? [diagnosticFor(view.state, errorPosition, errorMessage || 'Parse error')]
            : [];
        view.dispatch(setDiagnostics(view.state, diagnostics));
    }, [errorPosition, errorMessage]);

    return (
        <div className={'editor-wrap' + (status === 'correct' ? ' correct' : '')}>
            <CodeMirror
                value={value}
                onChange={onChange}
                onCreateEditor={(view) => {
                    viewRef.current = view;
                }}
                extensions={extensions}
                minHeight={minHeight}
                basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: false,
                    foldGutter: false,
                    autocompletion: false,
                }}
                placeholder='Type a SaneQL query — Ctrl/Cmd+Enter to run'
            />
        </div>
    );
}
