const STORAGE_KEY = 'vibeBook.pendingReaderQueueJobs';

export type PersistedReaderJobKind =
    | 'explain'
    | 'query'
    | 'summary'
    | 'idea-explain'
    | 'idea-extract'
    | 'ideas-explain';

export interface PersistedReaderQueueEntry {
    jobId: number;
    pdfId: number;
    chapterId: number;
    kind: PersistedReaderJobKind;
    /** User-visible label: query text, idea title, or fixed labels for tools */
    queryLabel?: string;
    createdAt: string;
    ideaId?: number;
    contextSentenceIds?: number[];
}

function readRaw(): PersistedReaderQueueEntry[] {
    try {
        const raw = globalThis.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(isValidEntry);
    } catch {
        return [];
    }
}

function isValidEntry(item: unknown): item is PersistedReaderQueueEntry {
    if (!item || typeof item !== 'object') return false;
    const o = item as Record<string, unknown>;
    return typeof o.jobId === 'number'
        && Number.isFinite(o.jobId)
        && typeof o.pdfId === 'number'
        && Number.isFinite(o.pdfId)
        && typeof o.chapterId === 'number'
        && Number.isFinite(o.chapterId)
        && typeof o.kind === 'string'
        && typeof o.createdAt === 'string';
}

function writeAll(entries: PersistedReaderQueueEntry[]): void {
    try {
        globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
        /* ignore quota / private mode */
    }
}

export function readPendingJobsForPdf(pdfId: number): PersistedReaderQueueEntry[] {
    return readRaw().filter((e) => e.pdfId === pdfId);
}

export function addPendingReaderJob(entry: PersistedReaderQueueEntry): void {
    const all = readRaw().filter((e) => e.jobId !== entry.jobId);
    all.push(entry);
    writeAll(all);
}

export function removePendingReaderJob(jobId: number): void {
    writeAll(readRaw().filter((e) => e.jobId !== jobId));
}
