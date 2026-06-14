import type { Diagnostic } from '@codemirror/lint';
import type { EditorState } from '@codemirror/state';
import type { ErrorPosition } from './types';

// Returns a CodeMirror lint diagnostic marking the single character at a 1-based {line, column}.
// At (or past) the end of a line the character before is marked instead, so the range is never empty.
export function diagnosticFor(state: EditorState, position: ErrorPosition, message: string): Diagnostic {
    const lineNo = Math.min(Math.max(position.line, 1), state.doc.lines);
    const line = state.doc.line(lineNo);
    const colIdx = Math.max(0, Math.min(position.column - 1, line.length));
    const from = line.from + colIdx;
    const to = Math.min(from + 1, line.to);
    if (to > from) return { from, to, severity: 'error' as const, message };
    return { from: Math.max(line.from, from - 1), to: from, severity: 'error', message };
}
