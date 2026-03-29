import { zipSync, strToU8 } from 'fflate';
import {
    fetchPdf,
    fetchChapters,
    fetchPageSentences,
    getSummaryByChapterId,
    fetchIdeasByChapterId,
    fetchIdeaArguments,
    fetchIdeaExplanations,
    fetchChatResponsesForChapter,
} from '@/lib/api';
import type {
    Chapter,
    ChapterSummary,
    IdeaArgumentDTO,
    IdeaExplanationDTO,
    IdeaWithSentences,
    PDF,
    PDFChatResponse,
    Sentence,
} from '@/types';
import {
    OFFLINE_BUNDLE_SCHEMA_VERSION,
    type OfflineBookPayload,
    type OfflineBundleManifest,
} from '@/types/offlineBundle';

const BUNDLE_PDF_ID = 1;
const APP_VERSION = '0.0.0';

function createIdGenerator() {
    let n = 1;
    return () => n++;
}

function activeChapterForPage(chapters: Chapter[], page: number): Chapter | undefined {
    return chapters.find((c) => page >= c.startPage && page <= c.endPage);
}

function remapIdeaRow(
    row: IdeaWithSentences,
    newIdeaId: number,
    sentenceMap: Map<number, number>,
): IdeaWithSentences {
    return {
        idea: { ideaId: newIdeaId, ideaTitle: row.idea.ideaTitle },
        sentences: row.sentences.map((s) => ({
            sentenceId: sentenceMap.get(s.sentenceId) ?? 0,
            sentenceContent: s.sentenceContent,
        })),
    };
}

function remapChatResponse(
    cr: PDFChatResponse,
    newChatId: number,
    sentenceMap: Map<number, number>,
): PDFChatResponse {
    return {
        chatResponseId: newChatId,
        query: cr.query,
        chatResponse: cr.chatResponse,
        contextSentencesIds: cr.contextSentencesIds
            .map((id) => sentenceMap.get(id))
            .filter((id): id is number => id != null),
    };
}

export interface OfflineBundlePayload {
    manifest: OfflineBundleManifest;
    book: OfflineBookPayload;
}

/** Build manifest + book (single API pass). Use for ZIP download and/or IndexedDB save. */
export async function buildOfflineBundlePayload(pdfId: string): Promise<OfflineBundlePayload> {
    const [pdfRaw, chaptersRaw] = await Promise.all([fetchPdf(pdfId), fetchChapters(pdfId)]);
    const sorted = [...chaptersRaw].sort((a, b) => a.startPage - b.startPage || a.id - b.id);
    const chapterMap = new Map<number, number>();
    sorted.forEach((ch, i) => chapterMap.set(ch.id, i + 1));

    const newChapters: Chapter[] = sorted.map((ch, i) => ({
        title: ch.title,
        startPage: ch.startPage,
        endPage: ch.endPage,
        sourceChapterId: ch.id,
        id: i + 1,
        pdfId: BUNDLE_PDF_ID,
    }));

    const sentenceMap = new Map<number, number>();
    const sentencesByPage: Record<number, Sentence[]> = {};
    const genSentenceId = createIdGenerator();

    for (let page = 1; page <= pdfRaw.totalPages; page++) {
        const pageSentences = await fetchPageSentences(pdfId, page);
        const ch = activeChapterForPage(newChapters, page);
        const chapterId = ch?.id ?? 1;
        const remapped: Sentence[] = [];

        for (const s of pageSentences) {
            const nid = genSentenceId();
            sentenceMap.set(s.id, nid);
            remapped.push({
                id: nid,
                content: s.content,
                sentenceIndex: s.sentenceIndex,
                pdfId: BUNDLE_PDF_ID,
                chapterId,
                sourceSentenceId: s.id,
            });
        }
        sentencesByPage[page] = remapped;
    }

    const genSummaryId = createIdGenerator();
    const genIdeaId = createIdGenerator();
    const genArgId = createIdGenerator();
    const genExplId = createIdGenerator();
    const summariesByChapterId: Record<number, ChapterSummary[]> = {};
    const ideaMap = new Map<number, number>();
    const ideasByChapterId: Record<number, IdeaWithSentences[]> = {};
    const ideaArgumentsByIdeaId: Record<number, IdeaArgumentDTO[]> = {};
    const ideaExplanationsByIdeaId: Record<number, IdeaExplanationDTO[]> = {};

    for (const ch of sorted) {
        const newChId = chapterMap.get(ch.id)!;
        const summaries = await getSummaryByChapterId(ch.id);
        summariesByChapterId[newChId] = summaries.map((sum) => ({
            id: genSummaryId(),
            summaryText: sum.summaryText,
        }));

        const ideas = await fetchIdeasByChapterId(ch.id);
        const remappedIdeas: IdeaWithSentences[] = [];
        for (const row of ideas) {
            const nid = genIdeaId();
            ideaMap.set(row.idea.ideaId, nid);
            remappedIdeas.push(remapIdeaRow(row, nid, sentenceMap));
        }
        ideasByChapterId[newChId] = remappedIdeas;

        for (const row of ideas) {
            const newIdeaIdVal = ideaMap.get(row.idea.ideaId)!;
            const [args, expls] = await Promise.all([
                fetchIdeaArguments(row.idea.ideaId),
                fetchIdeaExplanations(row.idea.ideaId),
            ]);
            ideaArgumentsByIdeaId[newIdeaIdVal] = args.map((a) => ({
                id: genArgId(),
                text: a.text,
            }));
            ideaExplanationsByIdeaId[newIdeaIdVal] = expls.map((e) => ({
                id: genExplId(),
                ideaId: newIdeaIdVal,
                text: e.text,
            }));
        }
    }

    const genChatId = createIdGenerator();
    const chatResponsesByChapterId: Record<number, PDFChatResponse[]> = {};
    for (const ch of sorted) {
        const newChId = chapterMap.get(ch.id)!;
        const chats = await fetchChatResponsesForChapter(ch.id);
        chatResponsesByChapterId[newChId] = chats.map((cr) => remapChatResponse(cr, genChatId(), sentenceMap));
    }

    const pdf: PDF = {
        id: BUNDLE_PDF_ID,
        title: pdfRaw.title,
        totalPages: pdfRaw.totalPages,
        createdAt: new Date().toISOString(),
    };

    const book: OfflineBookPayload = {
        pdf,
        chapters: newChapters,
        sentencesByPage,
        summariesByChapterId,
        ideasByChapterId,
        ideaArgumentsByIdeaId,
        ideaExplanationsByIdeaId,
        chatResponsesByChapterId,
    };

    const manifest: OfflineBundleManifest = {
        schemaVersion: OFFLINE_BUNDLE_SCHEMA_VERSION,
        exportId: crypto.randomUUID(),
        exportedAt: new Date().toISOString(),
        appVersion: APP_VERSION,
        sourcePdfId: pdfRaw.id,
        sourcePdfTitle: pdfRaw.title,
    };

    return { manifest, book };
}

export function offlineBundlePayloadToZipBlob(payload: OfflineBundlePayload): Blob {
    const zipObj: Record<string, Uint8Array> = {
        'manifest.json': strToU8(JSON.stringify(payload.manifest)),
        'book.json': strToU8(JSON.stringify(payload.book)),
    };
    const zipped = zipSync(zipObj, { level: 6 });
    return new Blob([new Uint8Array(zipped)], { type: 'application/zip' });
}

/**
 * Fetches all reader-facing data for a PDF and returns a ZIP blob (manifest.json + book.json).
 */
export async function buildOfflineBundleZip(pdfId: string): Promise<Blob> {
    const payload = await buildOfflineBundlePayload(pdfId);
    return offlineBundlePayloadToZipBlob(payload);
}
