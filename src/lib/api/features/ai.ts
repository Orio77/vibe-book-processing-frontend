import type {
    ChapterSummary,
    IdeaArgumentDTO,
    IdeaExplanationDTO,
    IdeaWithSentences,
} from '$lib/types';
import apiClient from '../core/client';
import { coerceNumber, emptyOn204, unwrapArrayPayload } from '../core/helpers';

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
    const res = await apiClient.get<unknown>(`${PROCESS_URL}/chapter/${chapterId}/summary`);
    return unwrapArrayPayload<ChapterSummary>(emptyOn204(res), ['summaries', 'data', 'content']);
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

function normalizeIdeaWithSentences(raw: RawIdeaWithSentences): IdeaWithSentences {
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
}

export async function fetchIdea(ideaId: number): Promise<IdeaWithSentences> {
    const res = await apiClient.get<RawIdeaWithSentences>(`${PROCESS_URL}/idea/get/${ideaId}`);
    return normalizeIdeaWithSentences(res.data);
}

export async function deleteIdea(ideaId: number): Promise<void> {
    await apiClient.delete(`${PROCESS_URL}/idea/delete/${ideaId}`);
}

export async function fetchIdeasByChapterId(chapterId: number): Promise<IdeaWithSentences[]> {

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

export async function fetchIdeaExplanation(explanationId: number): Promise<IdeaExplanationDTO> {
    const res = await apiClient.get<RawIdeaExplanation>(`${PROCESS_URL}/idea/explanations/${explanationId}`);
    return normalizeIdeaExplanation(res.data);
}

export async function updateIdeaExplanation(explanationId: number, text: string): Promise<IdeaExplanationDTO> {
    const res = await apiClient.put<RawIdeaExplanation>(
        `${PROCESS_URL}/idea/explanations/${explanationId}`,
        text,
        { headers: { 'Content-Type': 'text/plain' } }
    );
    return normalizeIdeaExplanation(res.data);
}

export async function deleteIdeaExplanation(explanationId: number): Promise<void> {
    await apiClient.delete(`${PROCESS_URL}/idea/explanations/${explanationId}`);
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
