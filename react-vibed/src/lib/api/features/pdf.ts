import type { ChapterPageRange, PDF } from '@/types';
import apiClient, { resolveApiRootBaseUrl } from '../core/client';
import { emptyOn204 } from '../core/helpers';

export interface QueueJob {
    id: number;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'BEING_MODIFIED';
    resultId: number | null;
    errorText?: string | null;
}

export async function fetchAllPdfs(): Promise<PDF[]> {
    const res = await apiClient.get<PDF[]>('/get/all');
    return emptyOn204(res) as PDF[];
}

export async function fetchPdf(id: number | string): Promise<PDF> {
    const res = await apiClient.get<PDF>(`/get/${id}`);
    return res.data;
}

export async function deletePdf(id: number | string): Promise<void> {
    await apiClient.delete(`/delete/${id}`);
}

export async function uploadPdf(
    file: File,
    chapterPageRanges: ChapterPageRange[],
): Promise<{ mode: 'queued'; jobId: number } | { mode: 'ready'; pdfId: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append(
        'chapterPageRanges',
        new Blob([JSON.stringify(chapterPageRanges)], { type: 'application/json' }),
    );

    const res = await apiClient.post<number>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (res.status === 202) {
        return { mode: 'queued', jobId: res.data };
    }

    return { mode: 'ready', pdfId: res.data };
}

export async function fetchQueueJob(id: number): Promise<QueueJob> {
    const res = await apiClient.get<QueueJob>(`/api/job/${id}`, {
        baseURL: resolveApiRootBaseUrl(),
    });
    return res.data;
}
