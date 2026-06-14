export const SEQUENCE_MIN_LENGTH = 40;

// Biological sequences are uppercase IUPAC symbols (nucleotide or amino acid) plus gap/stop. This
// excludes free-text columns that merely happen to be long (e.g. an author or lab list with commas).
const SEQUENCE_ALPHABET = /^[A-Z.*-]+$/;

const isSequenceValue = (value) => typeof value === 'string' && value.length > 0 && SEQUENCE_ALPHABET.test(value);

// Classifies each column from the result rows so the table can collapse long sequence values. A
// column is a sequence when all its non-null values use the sequence alphabet and the longest
// reaches SEQUENCE_MIN_LENGTH; it is an alignment when every non-null value shares the same length.
export function classifyColumns(rows, columns) {
    const result = {};
    for (const column of columns) {
        const present = rows.map((row) => row[column]).filter((value) => value !== null && value !== undefined);
        const allSequenceLike = present.length > 0 && present.every(isSequenceValue);
        const maxLength = present.reduce((max, value) => Math.max(max, value.length), 0);
        const isSequence = allSequenceLike && maxLength >= SEQUENCE_MIN_LENGTH;
        const lengths = new Set(present.map((value) => value.length));
        result[column] = {
            isSequence,
            isAligned: isSequence && lengths.size === 1,
            length: isSequence && lengths.size === 1 ? maxLength : null,
        };
    }
    return result;
}

const BASE_COLORS = {
    'A': 'base-a',
    'C': 'base-c',
    'G': 'base-g',
    'T': 'base-t',
    'U': 'base-t',
    '-': 'base-gap',
    'N': 'base-n',
};

// Returns a CSS class for a nucleotide/gap symbol, or undefined for other characters (e.g. amino acids).
export function baseColorClass(symbol) {
    return BASE_COLORS[symbol?.toUpperCase()];
}

const NUCLEOTIDE_ALPHABET = /^[ACGTUN\-.RYSWKMBDHV]+$/i;

// Cosmetic label for a sequence's length: 'nt' for nucleotide-like strings, otherwise 'aa'.
export function sequenceUnit(value) {
    return NUCLEOTIDE_ALPHABET.test(value.slice(0, 100)) ? 'nt' : 'aa';
}
