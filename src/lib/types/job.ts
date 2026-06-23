export type JobType = 'PDF_UPLOAD' | 'CHAT' | 'CHAPTER_SUMMARY' | 'IDEA_EXTRACTION' | 'IDEA_EXPLANATION';
export type JobStatus = 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface Job {
    id: number;
    type: JobType;
    status: JobStatus;
    error?: string;
    createdAt?: string;
    completedAt?: string;
    chapterId?: number;
    ideaId?: number;
}
