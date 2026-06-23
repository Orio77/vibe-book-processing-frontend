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
import type { OfflineBookPayload, OfflineBundleManifest } from '@/types/offlineBundle';

/**
 * In-memory editable copy of book data (after `structuredClone` from a pack).
 * Same fields as `OfflineBookPayload` without readonly modifiers.
 */
export interface MutableOfflineBookPayload {
    pdf: PDF;
    chapters: Chapter[];
    sentencesByPage: Record<number, Sentence[]>;
    summariesByChapterId: Record<number, ChapterSummary[]>;
    ideasByChapterId: Record<number, IdeaWithSentences[]>;
    ideaArgumentsByIdeaId: Record<number, IdeaArgumentDTO[]>;
    ideaExplanationsByIdeaId: Record<number, IdeaExplanationDTO[]>;
    chatResponsesByChapterId: Record<number, PDFChatResponse[]>;
}

/** One saved offline pack in IndexedDB. */
export interface OfflineBookRecord {
    exportId: string;
    manifest: OfflineBundleManifest;
    book: OfflineBookPayload;
    lastPage: number;
    updatedAt: string;
}
