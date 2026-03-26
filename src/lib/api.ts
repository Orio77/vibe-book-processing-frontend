import axios from 'axios';
import type {
    PDF,
    Chapter,
    Sentence,
    ChapterPageRange,
    ChapterSummary,
    IdeaWithSentences,
    IdeaArgumentDTO,
    IdeaExplanationDTO,
    PDFChatResponse,
} from '@/types';

/**
 * Configured Axios instance.
 * Base URL is read from VITE_API_BASE_URL env variable.
 */
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        Accept: 'application/json',
    },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Many backend endpoints return 204 No Content for empty collections.
 * This helper normalises that to an empty array.
 */
function emptyOn204<T>(response: { status: number; data: T }): T | [] {
    return response.status === 204 ? [] : response.data;
}

// ---------------------------------------------------------------------------
// PDF CRUD
// ---------------------------------------------------------------------------

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

export interface QueueJob {
    id: number;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'BEING_MODIFIED';
    resultId: number | null;
    errorText?: string | null;
}

export async function fetchQueueJob(id: number): Promise<QueueJob> {
    const res = await apiClient.get<QueueJob>(`/job/${id}`, {
        baseURL: import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/pdf\/?$/, ''),
    });
    return res.data;
}

// ---------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------

export async function fetchChapters(pdfId: number | string): Promise<Chapter[]> {
    const res = await apiClient.get<Chapter[]>(`/chapter/get/all/${pdfId}`);
    return emptyOn204(res) as Chapter[];
}

// ---------------------------------------------------------------------------
// Sentences / page content
// ---------------------------------------------------------------------------

export async function fetchPageSentences(
    pdfId: number | string,
    page: number,
): Promise<Sentence[]> {
    const res = await apiClient.get<Sentence[]>(`/sentence/get/${pdfId}`, {
        params: { startPage: page, endPage: page },
    });
    return emptyOn204(res) as Sentence[];
}

// ---------------------------------------------------------------------------
// AI Processing tools
// ---------------------------------------------------------------------------

const PROCESS_URL = 'process';

export async function createChapterSummary(
    chapterId: number,
): Promise<number> {
    const res = await apiClient.post<number>(
        `${PROCESS_URL}/chapter/summary`,
        null,
        { params: { chapterId } },
    );
    return res.data;
}

export async function getChapterSummary(id: number): Promise<string> {
    const res = await apiClient.get<string>(`${PROCESS_URL}/chapter/summary/${id}`);
    return res.data;
}

export async function getSummaryByChapterId(chapterId: number): Promise<ChapterSummary[]> {
    const res = await apiClient.get<ChapterSummary[]>(`${PROCESS_URL}/chapter/${chapterId}/summary`);
    return res.data;
}

export async function deleteChapterSummary(id: number): Promise<void> {
    await apiClient.delete(`${PROCESS_URL}/chapter/summary/${id}`);
}

export async function createBookSummary(pdfId: number): Promise<void> {
    await apiClient.post(`${PROCESS_URL}/book/summary`, null, {
        params: { pdfId },
    });
}

export async function markKeyIdeas(
    chapterId: number,
): Promise<void> {
    await apiClient.post(`${PROCESS_URL}/idea/extract`, null, {
        params: { chapterId },
    });
}

export async function fetchIdeasByChapterId(chapterId: number): Promise<IdeaWithSentences[]> {
    interface RawIdeaDTO {
        ideaId?: number | string;
        id?: number | string;
        ideaTitle?: string;
        title?: string;
    }

    interface RawSentenceDTO {
        sentenceId?: number | string;
        id?: number | string;
        sentenceContent?: string;
        content?: string;
    }

    interface RawIdeaWithSentences {
        idea?: RawIdeaDTO;
        sentences?: RawSentenceDTO[];
    }

    const normalizeIdeaWithSentences = (raw: RawIdeaWithSentences): IdeaWithSentences => {
        const rawIdeaId = raw.idea?.ideaId ?? raw.idea?.id;
        const ideaId = coerceNumber(rawIdeaId);
        if (ideaId === null) {
            throw new TypeError('Idea id is missing in backend payload');
        }

        const ideaTitle = raw.idea?.ideaTitle ?? raw.idea?.title ?? '';

        const sentences = (raw.sentences ?? []).map((sentence) => {
            const rawSentenceId = sentence.sentenceId ?? sentence.id;
            const sentenceId = coerceNumber(rawSentenceId);
            if (sentenceId === null) {
                throw new TypeError('Sentence id is missing in idea payload');
            }

            return {
                sentenceId,
                sentenceContent: sentence.sentenceContent ?? sentence.content ?? '',
            };
        });

        return {
            idea: {
                ideaId,
                ideaTitle,
            },
            sentences,
        };
    };

    const res = await apiClient.get<RawIdeaWithSentences[]>(`${PROCESS_URL}/idea/get/all/${chapterId}`);
    const data = emptyOn204(res) as RawIdeaWithSentences[];
    return data.map(normalizeIdeaWithSentences);
}

export async function fetchIdeaArguments(ideaId: number): Promise<IdeaArgumentDTO[]> {
    const res = await apiClient.get<IdeaArgumentDTO[]>(`${PROCESS_URL}/idea/argument/get/${ideaId}`);
    return emptyOn204(res) as IdeaArgumentDTO[];
}

interface RawIdeaExplanation {
    id?: number | string;
    explanationId?: number | string;
    text?: string;
    content?: string;
    explanationText?: string;
    ideaId?: number | string;
    idea?: {
        id?: number | string;
        ideaId?: number | string;
    };
}

function normalizeIdeaExplanation(raw: RawIdeaExplanation, fallbackIdeaId?: number): IdeaExplanationDTO {
    const explanationId = coerceNumber(raw.id ?? raw.explanationId);
    const resolvedIdeaId = coerceNumber(raw.ideaId ?? raw.idea?.id ?? raw.idea?.ideaId) ?? fallbackIdeaId ?? null;
    const text = raw.text ?? raw.content ?? raw.explanationText ?? '';

    if (explanationId === null) {
        throw new TypeError('Idea explanation id is missing in backend payload');
    }

    if (resolvedIdeaId === null) {
        throw new TypeError('Idea id is missing in backend payload');
    }

    return {
        id: explanationId,
        ideaId: resolvedIdeaId,
        text,
    };
}

export async function createIdeaExplanation(ideaId: number, ideaContent: string): Promise<IdeaExplanationDTO> {
    const res = await apiClient.post<RawIdeaExplanation>(
        `${PROCESS_URL}/idea/${ideaId}/explanation`,
        ideaContent,
        { headers: { 'Content-Type': 'text/plain' } },
    );
    return normalizeIdeaExplanation(res.data, ideaId);
}

export async function fetchIdeaExplanations(ideaId: number): Promise<IdeaExplanationDTO[]> {
    const res = await apiClient.get<RawIdeaExplanation[]>(`${PROCESS_URL}/idea/${ideaId}/explanations`);
    const data = emptyOn204(res) as RawIdeaExplanation[];
    return data.flatMap((item) => {
        try {
            return [normalizeIdeaExplanation(item, ideaId)];
        } catch (error) {
            console.warn('Skipping malformed idea explanation payload item', error);
            return [];
        }
    });
}

export async function markExamples(
    pdfId: number,
    chapterId: number,
): Promise<void> {
    await apiClient.post(`${PROCESS_URL}/chapter/examples`, null, {
        params: { pdfId, chapterId },
    });
}

export async function processChapterContext(
    pdfId: number,
    chapterId: number,
    bookContext: boolean,
): Promise<void> {
    await apiClient.post(`${PROCESS_URL}/chapter/context`, null, {
        params: { pdfId, chapterId, bookContext },
    });
}

// ---------------------------------------------------------------------------
// Chat & Explanations
// ---------------------------------------------------------------------------

export interface PDFChatRequest {
    chapterId: number;
    query?: string;
    context: { sentenceId: number; sentenceContent: string }[];
}

interface RawPDFChatResponse {
    chatResponseId?: number;
    id?: number;
    responseId?: number;
    chat_response_id?: number;
    chatResponseID?: number;
    query: string | null;
    chatResponse: string;
    contextSentencesIds: number[];
}

function coerceNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function normalizeChatResponse(raw: RawPDFChatResponse): PDFChatResponse {
    const resolvedId = coerceNumber(
        raw.chatResponseId
        ?? raw.id
        ?? raw.responseId
        ?? raw.chat_response_id
        ?? raw.chatResponseID,
    );

    if (resolvedId === null) {
        throw new TypeError('Chat response id is missing in backend payload');
    }

    return {
        chatResponseId: resolvedId,
        query: raw.query,
        chatResponse: raw.chatResponse,
        contextSentencesIds: raw.contextSentencesIds,
    };
}

export async function fetchChat(request: PDFChatRequest): Promise<string> {
    const res = await apiClient.post<string>('/chat', request);
    return res.data;
}

export async function fetchExplanation(request: PDFChatRequest): Promise<string> {
    const res = await apiClient.post<string>('/chat/explain', request);
    return res.data;
}

export async function fetchChatResponsesForChapter(chapterId: number): Promise<PDFChatResponse[]> {
    const res = await apiClient.get<RawPDFChatResponse[]>(`/chat/response/get/all/${chapterId}`);
    const data = emptyOn204(res) as RawPDFChatResponse[];
    return data.map(normalizeChatResponse);
}

export async function updateChatResponse(chatResponseId: number, body: string): Promise<PDFChatResponse> {
    const res = await apiClient.put<RawPDFChatResponse>(`/chat/response/edit/${chatResponseId}`, body, {
        headers: { 'Content-Type': 'text/plain' },
    });
    return normalizeChatResponse(res.data);
}

export async function deleteChatResponse(chatResponseId: number): Promise<void> {
    await apiClient.delete(`/chat/response/delete/${chatResponseId}`);
}

export default apiClient;
