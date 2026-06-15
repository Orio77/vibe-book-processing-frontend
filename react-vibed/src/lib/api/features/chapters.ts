import type { Chapter, ChapterPageRange, Sentence } from '@/types';
import apiClient from '../core/client';
import { coerceNumber, emptyOn204, unwrapArrayPayload } from '../core/helpers';

interface RawChapter {
    id?: number | string;
    chapterId?: number | string;
    title?: string;
    chapterTitle?: string;
    startPage?: number | string;
    endPage?: number | string;
    pageStart?: number | string;
    pageEnd?: number | string;
    pdfId?: number | string;
    sourceChapterId?: number | string;
    pdf?: { id?: number | string; pdfId?: number | string };
    pdfModel?: { id?: number | string; pdfId?: number | string };
}

function normalizeChapter(raw: RawChapter, fallbackPdfId: number | string): Chapter {
    const resolvedId = coerceNumber(raw.id ?? raw.chapterId);
    const resolvedStartPage = coerceNumber(raw.startPage ?? raw.pageStart);
    const resolvedEndPage = coerceNumber(raw.endPage ?? raw.pageEnd);
    const resolvedPdfId = coerceNumber(
        raw.pdfId
        ?? raw.pdf?.id
        ?? raw.pdf?.pdfId
        ?? raw.pdfModel?.id
        ?? raw.pdfModel?.pdfId
        ?? fallbackPdfId,
    );

    if (resolvedId === null) {
        throw new TypeError('Chapter id is missing in backend payload');
    }
    if (resolvedStartPage === null || resolvedEndPage === null) {
        throw new TypeError('Chapter page range is missing in backend payload');
    }
    if (resolvedPdfId === null) {
        throw new TypeError('Chapter pdf id is missing in backend payload');
    }

    return {
        id: resolvedId,
        title: raw.title ?? raw.chapterTitle ?? '',
        startPage: resolvedStartPage,
        endPage: resolvedEndPage,
        pdfId: resolvedPdfId,
        sourceChapterId: coerceNumber(raw.sourceChapterId ?? raw.chapterId) ?? undefined,
    };
}

interface RawSentence {
    id?: number | string;
    sentenceId?: number | string;
    content?: string;
    sentenceContent?: string;
    text?: string;
    sentenceIndex?: number | string;
    index?: number | string;
    pdfId?: number | string;
    chapterId?: number | string;
    sourceSentenceId?: number | string;
    chapter?: { id?: number | string; chapterId?: number | string };
    chapterModel?: { id?: number | string; chapterId?: number | string };
    pdf?: { id?: number | string; pdfId?: number | string };
    pdfModel?: { id?: number | string; pdfId?: number | string };
}

function normalizeSentence(raw: RawSentence, fallbackPdfId: number | string): Sentence {
    const resolvedId = coerceNumber(raw.id ?? raw.sentenceId);
    const resolvedSentenceIndex = coerceNumber(raw.sentenceIndex ?? raw.index);
    const resolvedPdfId = coerceNumber(
        raw.pdfId
        ?? raw.pdf?.id
        ?? raw.pdf?.pdfId
        ?? raw.pdfModel?.id
        ?? raw.pdfModel?.pdfId
        ?? fallbackPdfId,
    );
    const resolvedChapterId = coerceNumber(
        raw.chapterId
        ?? raw.chapter?.id
        ?? raw.chapter?.chapterId
        ?? raw.chapterModel?.id
        ?? raw.chapterModel?.chapterId,
    );

    if (resolvedId === null) {
        throw new TypeError('Sentence id is missing in backend payload');
    }
    if (resolvedSentenceIndex === null) {
        throw new TypeError('Sentence index is missing in backend payload');
    }
    if (resolvedPdfId === null) {
        throw new TypeError('Sentence pdf id is missing in backend payload');
    }
    if (resolvedChapterId === null) {
        throw new TypeError('Sentence chapter id is missing in backend payload');
    }

    return {
        id: resolvedId,
        content: raw.content ?? raw.sentenceContent ?? raw.text ?? '',
        sentenceIndex: resolvedSentenceIndex,
        pdfId: resolvedPdfId,
        chapterId: resolvedChapterId,
        sourceSentenceId: coerceNumber(raw.sourceSentenceId ?? raw.sentenceId) ?? undefined,
    };
}

export async function fetchChapters(pdfId: number | string): Promise<Chapter[]> {
    const res = await apiClient.get<unknown>(`/chapter/get/all/${pdfId}`);

    const rawList = unwrapArrayPayload<RawChapter>(emptyOn204(res), ['chapters', 'data', 'content']);
    return rawList.map((chapter) => normalizeChapter(chapter, pdfId));
}

export async function fetchPageSentences(
    pdfId: number | string,
    page: number,
): Promise<Sentence[]> {
    const params = { startPage: page, endPage: page };
    const res = await apiClient.get<unknown>(`/sentence/get/${pdfId}`, { params });

    const rawList = unwrapArrayPayload<RawSentence>(emptyOn204(res), ['sentences', 'data', 'content']);
    return rawList.map((sentence) => normalizeSentence(sentence, pdfId));
}

export async function fetchSentencesInRanges(
    pdfId: number | string,
    ranges: ChapterPageRange[],
): Promise<Sentence[][]> {
    const res = await apiClient.post<unknown>(`/sentence/get/ranges/${pdfId}`, ranges);
    const rawGroups = emptyOn204(res);

    if (!Array.isArray(rawGroups)) {
        return [];
    }

    return rawGroups.map((group) => {
        const rawSentences = unwrapArrayPayload<RawSentence>(group, ['sentences', 'data', 'content']);
        return rawSentences.map((sentence) => normalizeSentence(sentence, pdfId));
    });
}
