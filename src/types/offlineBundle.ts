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

export const OFFLINE_BUNDLE_SCHEMA_VERSION = 1 as const;

export interface OfflineBundleManifest {
    readonly schemaVersion: typeof OFFLINE_BUNDLE_SCHEMA_VERSION;
    readonly exportId: string;
    readonly exportedAt: string;
    readonly appVersion: string;
    readonly sourcePdfId: number;
    readonly sourcePdfTitle: string;
}

export interface OfflineBookPayload {
    readonly pdf: PDF;
    readonly chapters: Chapter[];
    /** Page number → sentences for that page (remapped ids). */
    readonly sentencesByPage: Record<number, Sentence[]>;
    readonly summariesByChapterId: Record<number, ChapterSummary[]>;
    readonly ideasByChapterId: Record<number, IdeaWithSentences[]>;
    readonly ideaArgumentsByIdeaId: Record<number, IdeaArgumentDTO[]>;
    readonly ideaExplanationsByIdeaId: Record<number, IdeaExplanationDTO[]>;
    readonly chatResponsesByChapterId: Record<number, PDFChatResponse[]>;
}

export interface ParsedOfflineBundle {
    readonly manifest: OfflineBundleManifest;
    readonly book: OfflineBookPayload;
    readonly sentencesByPage: ReadonlyMap<number, Sentence[]>;
}
