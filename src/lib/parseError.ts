// Extracts a 1-based {line, column} from a RhyDB error message such as
//   "Parse error at 2:21: Expected RightParen but got LeftBrace"
// Returns null when the message carries no position.
import type { ErrorPosition } from './types';

export function parseErrorPosition(message: unknown): ErrorPosition | null {
    if (typeof message !== 'string') return null;
    const m = message.match(/\bat (\d+):(\d+)/);
    if (!m) return null;
    return { line: Number(m[1]), column: Number(m[2]) };
}
