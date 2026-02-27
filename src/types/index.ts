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
}

export interface Sentence {
    id: number;
    content: string;
    sentenceIndex: number;
    pdfId: number;
    chapterId: number;
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
