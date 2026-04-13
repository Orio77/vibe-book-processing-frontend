const PENDING_UPLOAD_JOB_IDS_KEY = 'pendingUploadJobIds';

function parseIds(value: unknown): number[] {
    if (!Array.isArray(value)) return [];
    return value
        .map(Number)
        .filter((item) => Number.isFinite(item));
}

export function readPendingUploadJobIds(): number[] {
    try {
        const raw = globalThis.localStorage.getItem(PENDING_UPLOAD_JOB_IDS_KEY);
        if (!raw) return [];
        return parseIds(JSON.parse(raw));
    } catch {
        return [];
    }
}

export function writePendingUploadJobIds(jobIds: number[]): void {
    globalThis.localStorage.setItem(PENDING_UPLOAD_JOB_IDS_KEY, JSON.stringify(jobIds));
}

export function addPendingUploadJobId(jobId: number): void {
    const existing = readPendingUploadJobIds().filter((id) => id !== jobId);
    existing.push(jobId);
    writePendingUploadJobIds(existing);
}

export function removePendingUploadJobId(jobId: number): void {
    writePendingUploadJobIds(readPendingUploadJobIds().filter((id) => id !== jobId));
}
