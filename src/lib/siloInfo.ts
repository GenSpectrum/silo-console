export type SiloInfo = {
    version: string;
    sequenceCount: number;
    horizontalBitmapsSize?: number;
    verticalBitmapsSize?: number;
};

export async function fetchSiloInfo(base: string): Promise<SiloInfo> {
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
    if (!isSiloInfo(value)) {
        throw new Error('The /info response does not look like a SILO instance.');
    }
    return value;
}

function isSiloInfo(value: unknown): value is SiloInfo {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Record<string, unknown>;
    return typeof candidate.version === 'string' && typeof candidate.sequenceCount === 'number';
}
