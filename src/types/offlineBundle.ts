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

/** Current export format (stable source ids for merge-after-re-export). */
export const OFFLINE_BUNDLE_SCHEMA_VERSION = 2 as const;
/** Legacy packs without sourceSentenceId / sourceChapterId. */
export const OFFLINE_BUNDLE_SCHEMA_VERSION_LEGACY = 1 as const;

export type OfflineBundleSchemaVersion =
    | typeof OFFLINE_BUNDLE_SCHEMA_VERSION
    | typeof OFFLINE_BUNDLE_SCHEMA_VERSION_LEGACY;

export interface OfflineBundleManifest {
    readonly schemaVersion: OfflineBundleSchemaVersion;
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
