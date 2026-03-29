/** Shared domain types for the PDF book processing app */

export interface PDF {
    id: number;
    title: string;
    totalPages: number;
    createdAt: string;
}

export interface Chapter {
    id: number;
    title: string;
    startPage: number;
    endPage: number;
    pdfId: number;
    /** Server chapter id from the API (offline packs v2+); used to merge after re-export. */
    sourceChapterId?: number;
}

export interface Sentence {
    id: number;
    content: string;
    sentenceIndex: number;
    pdfId: number;
    chapterId: number;
    /** Server sentence id from the API (offline packs v2+); used to merge after re-export. */
    sourceSentenceId?: number;
}

export interface ChapterPageRange {
    startPage: number;
    endPage: number;
}

export interface ChapterRangeInput {
    startPage: string;
    endPage: string;
}

export interface ChapterSummary {
    id: number;
    summaryText: string;
}

export interface ToastData {
    readonly message: string;
    readonly type: 'success' | 'error';
}

export interface IdeaDTO {
    ideaId: number;
    ideaTitle: string;
}

export interface SentenceDTO {
    sentenceId: number;
    sentenceContent: string;
}

export interface IdeaWithSentences {
    idea: IdeaDTO;
    sentences: SentenceDTO[];
}

export interface IdeaArgumentDTO {
    id: number;
    text: string;
}

export interface IdeaExplanationDTO {
    id: number;
    ideaId: number;
    text: string;
}

export interface PDFChatResponse {
    chatResponseId: number;
    query: string | null;
    chatResponse: string;
    contextSentencesIds: number[];
}

export type ReaderViewTheme = 'light' | 'sepia' | 'dark';

export type ReaderViewTextWidth = 'narrow' | 'medium' | 'wide';

export type ReaderViewScrollMode = 'vertical' | 'horizontal';

export interface ReaderViewSettings {
    fontSize: number;
    lineHeight: number;
    textWidth: ReaderViewTextWidth;
    theme: ReaderViewTheme;
    scrollMode: ReaderViewScrollMode;
    pageFlipEnabled: boolean;
}
