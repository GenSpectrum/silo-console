export type QueryPrimitive = string | number | boolean | null;
export type QueryValue = QueryPrimitive | QueryValue[] | { [key: string]: QueryValue };
export type QueryRow = Record<string, QueryValue | undefined>;

export type QueryResult = {
    rows: QueryRow[];
    dataVersion: string;
    executionMs: number;
    downloadMs: number;
    elapsedMs: number;
    source?: 'remote' | 'local';
};

export type ErrorPosition = {
    line: number;
    column: number;
};

export type SequenceEntry = {
    label: string;
    sequence: string;
};

export type SequenceViewerState =
    | {
          type: 'single';
          title: string;
          label: string;
          sequence: string;
      }
    | {
          type: 'alignment';
          title: string;
          entries: SequenceEntry[];
      };
