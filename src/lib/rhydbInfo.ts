export type RhyDBInfo = {
    version: string;
    sequenceCount: number;
    horizontalBitmapsSize?: number;
    verticalBitmapsSize?: number;
};

export async function fetchRhyDBInfo(base: string): Promise<RhyDBInfo> {
    let response: Response;
    try {
        response = await fetch(`${base}/info`);
    } catch {
        throw new Error('The server could not be reached. Check its address, network access, and CORS policy.');
    }

    if (!response.ok) {
        throw new Error(`The server returned HTTP ${response.status} from /info.`);
    }

    const value: unknown = await response.json();
    if (!isRhyDBInfo(value)) {
        throw new Error('The /info response does not look like a RhyDB instance.');
    }
    return value;
}

function isRhyDBInfo(value: unknown): value is RhyDBInfo {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Record<string, unknown>;
    return typeof candidate.version === 'string' && typeof candidate.sequenceCount === 'number';
}
