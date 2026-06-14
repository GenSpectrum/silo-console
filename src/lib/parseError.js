// Extracts a 1-based {line, column} from a SILO error message such as
//   "Parse error at 2:21: Expected RightParen but got LeftBrace"
// Returns null when the message carries no position.
export function parseErrorPosition(message) {
    if (typeof message !== 'string') return null;
    const m = message.match(/\bat (\d+):(\d+)/);
    if (!m) return null;
    return { line: Number(m[1]), column: Number(m[2]) };
}
