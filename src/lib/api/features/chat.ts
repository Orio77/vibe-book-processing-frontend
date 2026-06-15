import type { PDFChatResponse } from '$lib/types';
import apiClient from '../core/client';
import { coerceNumber, emptyOn204, unwrapArrayPayload } from '../core/helpers';

export interface PDFChatRequest {
    chapterId: number;
    /** Optional labels so the server can attach chapter/book context even when only a few sentences are sent. */
    chapterTitle?: string;
    bookTitle?: string;
    query?: string;
    context: { sentenceId: number; sentenceContent: string }[];
}

export type ChatDispatchResult =
    | { mode: 'queued'; jobId: number }
    | { mode: 'ready'; response: string };

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

function extractQueuedJobId(payload: unknown): number | null {
    const direct = coerceNumber(payload);
    if (direct !== null) {
        return direct;
    }

    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const candidate = payload as {
        jobId?: unknown;
        id?: unknown;
        queueJobId?: unknown;
        data?: unknown;
    };

    const nested = candidate.jobId ?? candidate.id ?? candidate.queueJobId;
    const nestedCoerced = coerceNumber(nested);
    if (nestedCoerced !== null) {
        return nestedCoerced;
    }

    if (candidate.data && typeof candidate.data === 'object') {
        return extractQueuedJobId(candidate.data);
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

export async function fetchChat(request: PDFChatRequest): Promise<ChatDispatchResult> {
    const res = await apiClient.post<unknown>('/chat', request);

    if (res.status === 202) {
        const queuedJobId = extractQueuedJobId(res.data);
        if (queuedJobId === null) {
            throw new TypeError('Chat queue job id is missing in backend payload');
        }
        return { mode: 'queued', jobId: queuedJobId };
    }

    if (typeof res.data !== 'string') {
        throw new TypeError('Chat response text is missing in backend payload');
    }

    return { mode: 'ready', response: res.data };
}

export async function fetchExplanation(request: PDFChatRequest): Promise<ChatDispatchResult> {
    return fetchChat({
        ...request,
        query: '',
    });
}

export async function fetchChatResponsesForChapter(chapterId: number): Promise<PDFChatResponse[]> {
    const res = await apiClient.get<unknown>(`/chat/response/get/all/${chapterId}`);
    const data = unwrapArrayPayload<RawPDFChatResponse>(emptyOn204(res), ['responses', 'chatResponses', 'data', 'content']);
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
