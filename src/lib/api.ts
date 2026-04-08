import type {
    Chapter,
    ChapterPageRange,
    ChapterSummary,
    IdeaArgumentDTO,
    IdeaExplanationDTO,
    IdeaWithSentences,
    PDF,
    PDFChatResponse,
    Sentence,
} from '@/types';
import axios from 'axios';

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

const AUTH_TOKEN_STORAGE_KEY = 'bookProcessing.authToken';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    try {
        const base64 = parts[1].replaceAll('-', '+').replaceAll('_', '/');
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        const json = globalThis.atob(padded);
        const parsed = JSON.parse(json) as unknown;
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }
        return parsed as Record<string, unknown>;
    } catch {
        return null;
    }
}

function isJwtExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);
    if (!payload) return false;

    const exp = payload.exp;
    if (typeof exp !== 'number' || !Number.isFinite(exp)) {
        return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return exp <= now;
}

function resolveApiRootBaseUrl(): string | undefined {
    const configured = import.meta.env.VITE_API_BASE_URL;
    if (!configured) return undefined;
    return configured.replace(/\/api\/pdf\/?$/, '');
}

export function getAuthToken(): string | null {
    const token = globalThis.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) return null;
    const normalized = token.trim();
    return normalized.length > 0 ? normalized : null;
}

export function setAuthToken(token: string): void {
    const normalized = token.trim();
    if (normalized.length === 0) {
        globalThis.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        return;
    }
    globalThis.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, normalized);
}

export function clearAuthToken(): void {
    globalThis.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function isAuthenticated(): boolean {
    const token = getAuthToken();
    if (!token) return false;

    if (isJwtExpired(token)) {
        clearAuthToken();
        return false;
    }

    return true;
}

function extractJwtToken(payload: unknown): string | null {
    if (typeof payload === 'string') {
        const normalized = payload.trim();
        return normalized.length > 0 ? normalized : null;
    }

    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const candidate = payload as {
        token?: unknown;
        jwt?: unknown;
        jwtToken?: unknown;
        bearerToken?: unknown;
        access?: unknown;
        accessToken?: unknown;
        access_token?: unknown;
        data?: unknown;
    };

    const directToken = candidate.token
        ?? candidate.jwt
        ?? candidate.jwtToken
        ?? candidate.bearerToken
        ?? candidate.access
        ?? candidate.accessToken
        ?? candidate.access_token;

    if (typeof directToken === 'string') {
        const normalizedDirectToken = directToken.trim();
        return normalizedDirectToken.length > 0 ? normalizedDirectToken : null;
    }

    if (candidate.data && typeof candidate.data === 'object') {
        return extractJwtToken(candidate.data);
    }

    return null;
}

apiClient.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (!token) {
        return config;
    }

    if (config.headers && typeof (config.headers as { set?: unknown }).set === 'function') {
        (config.headers as { set: (name: string, value: string) => void })
            .set('Authorization', `Bearer ${token}`);
    } else {
        config.headers = {
            ...(config.headers as Record<string, string> | undefined),
            Authorization: `Bearer ${token}`,
        } as typeof config.headers;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            clearAuthToken();

            if (globalThis.location !== undefined) {
                const isAuthRoute = globalThis.location.pathname.startsWith('/auth/');
                if (!isAuthRoute) {
                    globalThis.location.assign('/auth/login');
                }
            }
        }

        return Promise.reject(error);
    },
);

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

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const payload = error.response?.data;

        let serverMessage: string | null = null;

        if (typeof payload === 'string' && payload.trim().length > 0) {
            serverMessage = payload.trim();
        } else if (payload && typeof payload === 'object') {
            const candidate = (payload as { message?: unknown; error?: unknown; detail?: unknown });
            if (typeof candidate.message === 'string' && candidate.message.trim().length > 0) {
                serverMessage = candidate.message.trim();
            } else if (typeof candidate.error === 'string' && candidate.error.trim().length > 0) {
                serverMessage = candidate.error.trim();
            } else if (typeof candidate.detail === 'string' && candidate.detail.trim().length > 0) {
                serverMessage = candidate.detail.trim();
            }
        }

        if (serverMessage) {
            return status ? `${serverMessage} (HTTP ${status})` : serverMessage;
        }

        if (status) {
            return `${fallbackMessage} (HTTP ${status})`;
        }

        return error.message || fallbackMessage;
    }

    if (error instanceof Error && error.message.trim().length > 0) {
        return `${fallbackMessage}: ${error.message}`;
    }

    return fallbackMessage;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export async function registerUser(request: RegisterRequest): Promise<string | null> {
    const res = await apiClient.post<unknown>('/auth/register', request, {
        baseURL: resolveApiRootBaseUrl(),
    });

    const token = extractJwtToken(res.data);

    if (token) {
        setAuthToken(token);
    }

    return token;
}

export async function loginUser(request: LoginRequest): Promise<string> {
    const res = await apiClient.post<unknown>('/auth/login', request, {
        baseURL: resolveApiRootBaseUrl(),
    });

    const token = extractJwtToken(res.data);
    if (!token) {
        throw new TypeError('JWT token is missing in login response payload');
    }

    setAuthToken(token);
    return token;
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
    const res = await apiClient.get<QueueJob>(`/api/job/${id}`, {
        baseURL: resolveApiRootBaseUrl(),
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

export type ChapterSummaryDispatchResult =
    | { mode: 'queued'; jobId: number }
    | { mode: 'ready'; summaryId: number };

export async function createChapterSummary(
    chapterId: number,
): Promise<ChapterSummaryDispatchResult> {
    const res = await apiClient.post<number>(
        `${PROCESS_URL}/chapter/summary`,
        null,
        { params: { chapterId } },
    );

    if (res.status === 202) {
        return { mode: 'queued', jobId: res.data };
    }

    return { mode: 'ready', summaryId: res.data };
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

export type IdeaExtractionDispatchResult =
    | { mode: 'queued'; jobId: number }
    | { mode: 'ready' };

export type IdeasExplanationDispatchResult =
    | { mode: 'queued'; jobId: number }
    | { mode: 'ready' };

export async function markKeyIdeas(
    chapterId: number,
): Promise<IdeaExtractionDispatchResult> {
    const res = await apiClient.post<string | number>(`${PROCESS_URL}/idea/extract`, null, {
        params: { chapterId },
    });

    if (res.status === 202) {
        const queuedJobId = coerceNumber(res.data);
        if (queuedJobId === null) {
            throw new TypeError('Idea extraction queue job id is missing in backend payload');
        }
        return { mode: 'queued', jobId: queuedJobId };
    }

    return { mode: 'ready' };
}

export async function createIdeasExplanations(
    chapterId: number,
): Promise<IdeasExplanationDispatchResult> {
    const res = await apiClient.post<string | number>(`${PROCESS_URL}/idea/${chapterId}/explanations`);

    if (res.status === 202) {
        const queuedJobId = coerceNumber(res.data);
        if (queuedJobId === null) {
            throw new TypeError('Ideas explanation queue job id is missing in backend payload');
        }
        return { mode: 'queued', jobId: queuedJobId };
    }

    return { mode: 'ready' };
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

export type IdeaExplanationDispatchResult =
    | { mode: 'queued'; jobId: number }
    | { mode: 'ready'; explanation: IdeaExplanationDTO };

export async function createIdeaExplanation(ideaId: number, ideaContent: string): Promise<IdeaExplanationDispatchResult> {
    const res = await apiClient.post<RawIdeaExplanation | string | number>(
        `${PROCESS_URL}/idea/${ideaId}/explanation`,
        ideaContent,
        { headers: { 'Content-Type': 'text/plain' } },
    );

    if (res.status === 202) {
        const queuedJobId = coerceNumber(res.data);
        if (queuedJobId === null) {
            throw new TypeError('Idea explanation queue job id is missing in backend payload');
        }
        return { mode: 'queued', jobId: queuedJobId };
    }

    return { mode: 'ready', explanation: normalizeIdeaExplanation(res.data as RawIdeaExplanation, ideaId) };
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

export async function fetchChat(request: PDFChatRequest): Promise<ChatDispatchResult> {
    const res = await apiClient.post<string | number>('/chat', request);

    if (res.status === 202) {
        const queuedJobId = coerceNumber(res.data);
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
