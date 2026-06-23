import type { Chapter, PDFChatResponse } from '$lib/types';
import type { OfflineBookPayload, OfflineBundleManifest } from '$lib/types/offlineBundle';
import type { OfflineBundlePayload } from './buildExport';
import type { OfflineBookRecord } from '$lib/types/offlineLibrary';

export class MergeOfflineBookError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MergeOfflineBookError';
    }
}

function chapterAlignKey(ch: Chapter): string {
    return `${ch.startPage}|${ch.endPage}|${ch.title}`;
}

function hasSourceChapterIds(chapters: Chapter[]): boolean {
    return chapters.some((c) => c.sourceChapterId != null);
}

function hasSourceSentenceIds(book: OfflineBookPayload): boolean {
    for (const list of Object.values(book.sentencesByPage)) {
        for (const s of list) {
            if (s.sourceSentenceId != null) return true;
        }
    }
    return false;
}

/** Map old offline chapter id → new offline chapter id. */
export function buildChapterIdMap(oldChapters: Chapter[], newChapters: Chapter[]): Map<number, number> {
    const map = new Map<number, number>();

    if (hasSourceChapterIds(oldChapters) && hasSourceChapterIds(newChapters)) {
        const newBySource = new Map<number, number>();
        for (const nc of newChapters) {
            if (nc.sourceChapterId != null) {
                newBySource.set(nc.sourceChapterId, nc.id);
            }
        }
        for (const oc of oldChapters) {
            if (oc.sourceChapterId != null) {
                const nid = newBySource.get(oc.sourceChapterId);
                if (nid != null) map.set(oc.id, nid);
            }
        }
        if (map.size > 0) return map;
    }

    const newByKey = new Map<string, Chapter>();
    for (const nc of newChapters) {
        newByKey.set(chapterAlignKey(nc), nc);
    }
    for (const oc of oldChapters) {
        const match = newByKey.get(chapterAlignKey(oc));
        if (match) map.set(oc.id, match.id);
    }
    return map;
}

/** Map old offline sentence id → new offline sentence id. */
export function buildSentenceIdMap(oldBook: OfflineBookPayload, newBook: OfflineBookPayload): Map<number, number> {
    const map = new Map<number, number>();

    if (hasSourceSentenceIds(oldBook) && hasSourceSentenceIds(newBook)) {
        const newBySource = new Map<number, number>();
        for (const list of Object.values(newBook.sentencesByPage)) {
            for (const s of list) {
                if (s.sourceSentenceId != null) {
                    newBySource.set(s.sourceSentenceId, s.id);
                }
            }
        }
        for (const list of Object.values(oldBook.sentencesByPage)) {
            for (const s of list) {
                if (s.sourceSentenceId != null) {
                    const nid = newBySource.get(s.sourceSentenceId);
                    if (nid != null) map.set(s.id, nid);
                }
            }
        }
        if (map.size > 0) return map;
    }

    const pages = new Set<number>();
    for (const k of Object.keys(oldBook.sentencesByPage)) pages.add(Number(k));
    for (const k of Object.keys(newBook.sentencesByPage)) pages.add(Number(k));

    for (const page of pages) {
        const oldList = [...(oldBook.sentencesByPage[page] ?? [])].sort((a, b) => a.sentenceIndex - b.sentenceIndex);
        const newList = [...(newBook.sentencesByPage[page] ?? [])].sort((a, b) => a.sentenceIndex - b.sentenceIndex);
        const n = Math.min(oldList.length, newList.length);
        for (let i = 0; i < n; i++) {
            const o = oldList[i];
            const ne = newList[i];
            if (o.sentenceIndex !== ne.sentenceIndex) break;
            if (o.content.trim() !== ne.content.trim()) continue;
            map.set(o.id, ne.id);
        }
    }
    return map;
}

/**
 * Replace book content from a fresh export while preserving offline chat rows that still align.
 * Keeps `exportId` and clamps `lastPage`. Overwrites summaries/ideas/etc. from the new pack.
 */
export function mergeOfflineRecordWithNewPayload(
    existing: OfflineBookRecord,
    incoming: OfflineBundlePayload,
): OfflineBookRecord {
    if (existing.manifest.sourcePdfId !== incoming.manifest.sourcePdfId) {
        throw new MergeOfflineBookError(
            `This pack is for a different book (expected source PDF ${existing.manifest.sourcePdfId}, got ${incoming.manifest.sourcePdfId}).`,
        );
    }

    const oldBook = existing.book;
    const newBook = incoming.book;

    const chapterMap = buildChapterIdMap(oldBook.chapters, newBook.chapters);
    const sentenceMap = buildSentenceIdMap(oldBook, newBook);

    const remappedByChapter: Record<number, PDFChatResponse[]> = {};

    for (const [oldChIdStr, rows] of Object.entries(oldBook.chatResponsesByChapterId)) {
        const oldChId = Number(oldChIdStr);
        const newChId = chapterMap.get(oldChId);
        if (newChId == null) continue;

        for (const cr of rows) {
            const newContext = cr.contextSentencesIds
                .map((sid) => sentenceMap.get(sid))
                .filter((id): id is number => id != null);
            if (newContext.length === 0) continue;

            const remapped: PDFChatResponse = {
                ...cr,
                contextSentencesIds: newContext,
            };
            if (!remappedByChapter[newChId]) remappedByChapter[newChId] = [];
            remappedByChapter[newChId].push(remapped);
        }
    }

    const mergedChatByChapter: Record<number, PDFChatResponse[]> = {};
    const chapterIds = new Set<number>();
    for (const k of Object.keys(newBook.chatResponsesByChapterId)) chapterIds.add(Number(k));
    for (const k of Object.keys(remappedByChapter)) chapterIds.add(Number(k));

    for (const chId of chapterIds) {
        const incomingList = newBook.chatResponsesByChapterId[chId] ?? [];
        const userList = remappedByChapter[chId] ?? [];
        const seen = new Set<number>();
        const merged: PDFChatResponse[] = [];
        for (const r of userList) {
            if (!seen.has(r.chatResponseId)) {
                seen.add(r.chatResponseId);
                merged.push(r);
            }
        }
        for (const r of incomingList) {
            if (!seen.has(r.chatResponseId)) {
                seen.add(r.chatResponseId);
                merged.push(r);
            }
        }
        if (merged.length > 0) {
            mergedChatByChapter[chId] = merged;
        }
    }

    const total = newBook.pdf.totalPages;
    const lastPage = Math.min(Math.max(1, existing.lastPage), total);

    const mergedBook: OfflineBookPayload = {
        ...newBook,
        chatResponsesByChapterId: mergedChatByChapter,
    };

    const mergedManifest: OfflineBundleManifest = {
        ...incoming.manifest,
        exportId: existing.exportId,
        exportedAt: new Date().toISOString(),
    };

    return {
        exportId: existing.exportId,
        manifest: mergedManifest,
        book: mergedBook,
        lastPage,
        updatedAt: new Date().toISOString(),
    };
}
