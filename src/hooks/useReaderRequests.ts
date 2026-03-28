import { useState, useCallback, useEffect, useRef } from 'react';
import { useReaderSession, type ReaderSession } from '@/context/ReaderSessionContext';
import {
    fetchExplanation,
    fetchChat,
    fetchQueueJob,
    fetchChatResponsesForChapter,
    getApiErrorMessage,
} from '@/lib/api';
import {
    explainSentences,
    answerQueryWithContext,
    LlmRequestError,
    type OfflineLlmReaderContext,
} from '@/lib/llm/openaiCompatible';
import { loadOfflineLlmSettings } from '@/lib/llm/settings';
import { useJobCompletionSubscription } from './useJobCompletionSubscription';
import { buildOfflineFullChapterPlainText } from '@/lib/offline';
import type { Chapter, PDFChatResponse, Sentence } from '@/types';
import type { ParsedOfflineBundle } from '@/types/offlineBundle';

function buildOfflineLlmReaderContext(
    bundle: ParsedOfflineBundle,
    activeChapter: Chapter,
    bookTitleHint: string | null | undefined,
): OfflineLlmReaderContext {
    const book = bundle.book;
    const fullChapterText = buildOfflineFullChapterPlainText(book, activeChapter);

    return {
        bookTitle: (bookTitleHint ?? book.pdf.title).trim() || 'Unknown book',
        chapterTitle: activeChapter.title,
        chapterStartPage: activeChapter.startPage,
        chapterEndPage: activeChapter.endPage,
        fullChapterText,
    };
}

function nextOfflineSyntheticChatId(): number {
    return -(Date.now() * 1000 + Math.floor(Math.random() * 1000));
}

function appendOfflineChatRow(session: ReaderSession, chapterId: number, row: PDFChatResponse) {
    if (session.mode !== 'offline') return;
    session.patchBook((draft) => {
        const list = draft.chatResponsesByChapterId[chapterId] ?? [];
        draft.chatResponsesByChapterId[chapterId] = [row, ...list];
    });
}

export interface ReaderRequest {
    id: string;
    chapterId: number;
    jobId?: number;
    type: 'explain' | 'query' | 'summary' | 'idea-explain' | 'idea-extract';
    query?: string;
    sentences: Sentence[];
    timestamp: Date;
    status: 'pending' | 'success' | 'error';
    response?: string;
}

function formatLlmFailure(error: unknown, fallback: string): string {
    if (error instanceof LlmRequestError) return error.message;
    return getApiErrorMessage(error, fallback);
}

/**
 * Manages in-memory AI request history (explanations + chat queries).
 * Sends requests and tracks their lifecycle.
 */
export function useReaderRequests(
    activeChapter: Chapter | undefined,
    markedSentences: Sentence[],
    exitMarkingMode: () => void,
    bookTitle?: string | null,
) {
    const session = useReaderSession();
    const [requests, setRequests] = useState<ReaderRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<ReaderRequest | null>(null);
    const requestsRef = useRef<ReaderRequest[]>([]);
    const processingJobIdsRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        requestsRef.current = requests;
    }, [requests]);

    const handleRequestExplanation = useCallback(async () => {
        if (!activeChapter) return;

        const reqId = crypto.randomUUID();
        const newRequest: ReaderRequest = {
            id: reqId,
            chapterId: activeChapter.id,
            type: 'explain',
            sentences: [...markedSentences],
            timestamp: new Date(),
            status: 'pending',
        };

        setRequests(prev => [...prev, newRequest]);
        exitMarkingMode();

        if (session.mode === 'offline') {
            try {
                const settings = loadOfflineLlmSettings();
                const context = markedSentences.map(s => ({ sentenceId: s.id, sentenceContent: s.content }));
                const readerContext = buildOfflineLlmReaderContext(session.bundle, activeChapter, bookTitle);
                const text = await explainSentences(settings, context, readerContext);
                setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'success' as const, response: text } : r));
                setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'success' as const, response: text } : prev);
                appendOfflineChatRow(session, activeChapter.id, {
                    chatResponseId: nextOfflineSyntheticChatId(),
                    query: null,
                    chatResponse: text,
                    contextSentencesIds: markedSentences.map((s) => s.id),
                });
            } catch (error) {
                console.error('Failed to explain (offline LLM):', error);
                const errorMessage = formatLlmFailure(error, 'Failed to fetch explanation.');
                setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'error' as const, response: errorMessage } : r));
                setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'error' as const, response: errorMessage } : prev);
            }
            return;
        }

        const requestPayload = {
            chapterId: activeChapter.id,
            chapterTitle: activeChapter.title,
            bookTitle: bookTitle?.trim() || undefined,
            query: '',
            context: markedSentences.map(s => ({ sentenceId: s.id, sentenceContent: s.content })),
        };

        try {
            const result = await fetchExplanation(requestPayload);

            if (result.mode === 'queued') {
                setRequests(prev => prev.map(r => r.id === reqId ? { ...r, jobId: result.jobId } : r));
                setSelectedRequest(prev => prev?.id === reqId ? { ...prev, jobId: result.jobId } : prev);
                return;
            }

            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'success' as const, response: result.response } : r));
            setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'success' as const, response: result.response } : prev);
        } catch (error) {
            console.error('Failed to fetch explanation:', error);
            const errorMessage = getApiErrorMessage(error, 'Failed to fetch explanation.');
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'error' as const, response: errorMessage } : r));
            setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'error' as const, response: errorMessage } : prev);
        }
    }, [activeChapter, markedSentences, exitMarkingMode, session, bookTitle]);

    const handleSendQuery = useCallback(async (queryText: string) => {
        if (!queryText.trim() || !activeChapter) return;

        const reqId = crypto.randomUUID();
        const newRequest: ReaderRequest = {
            id: reqId,
            chapterId: activeChapter.id,
            type: 'query',
            query: queryText,
            sentences: [...markedSentences],
            timestamp: new Date(),
            status: 'pending',
        };

        setRequests(prev => [...prev, newRequest]);
        exitMarkingMode();

        if (session.mode === 'offline') {
            try {
                const settings = loadOfflineLlmSettings();
                const context = markedSentences.map(s => ({ sentenceId: s.id, sentenceContent: s.content }));
                const readerContext = buildOfflineLlmReaderContext(session.bundle, activeChapter, bookTitle);
                const text = await answerQueryWithContext(settings, queryText, context, readerContext);
                setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'success' as const, response: text } : r));
                setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'success' as const, response: text } : prev);
                appendOfflineChatRow(session, activeChapter.id, {
                    chatResponseId: nextOfflineSyntheticChatId(),
                    query: queryText,
                    chatResponse: text,
                    contextSentencesIds: markedSentences.map((s) => s.id),
                });
            } catch (error) {
                console.error('Failed to query (offline LLM):', error);
                const errorMessage = formatLlmFailure(error, 'Failed to fetch response.');
                setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'error' as const, response: errorMessage } : r));
                setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'error' as const, response: errorMessage } : prev);
            }
            return;
        }

        const requestPayload = {
            chapterId: activeChapter.id,
            chapterTitle: activeChapter.title,
            bookTitle: bookTitle?.trim() || undefined,
            query: queryText,
            context: markedSentences.map(s => ({ sentenceId: s.id, sentenceContent: s.content })),
        };

        try {
            const result = await fetchChat(requestPayload);

            if (result.mode === 'queued') {
                setRequests(prev => prev.map(r => r.id === reqId ? { ...r, jobId: result.jobId } : r));
                setSelectedRequest(prev => prev?.id === reqId ? { ...prev, jobId: result.jobId } : prev);
                return;
            }

            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'success' as const, response: result.response } : r));
            setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'success' as const, response: result.response } : prev);
        } catch (error) {
            console.error('Failed to fetch chat response:', error);
            const errorMessage = getApiErrorMessage(error, 'Failed to fetch response.');
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'error' as const, response: errorMessage } : r));
            setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'error' as const, response: errorMessage } : prev);
        }
    }, [activeChapter, markedSentences, exitMarkingMode, session, bookTitle]);

    const openRequest = useCallback((requestId: string) => {
        setSelectedRequest((current) => {
            if (current?.id === requestId) {
                return current;
            }

            return requests.find((request) => request.id === requestId) ?? null;
        });
    }, [requests]);

    const closeRequestModal = useCallback(() => setSelectedRequest(null), []);

    const registerSummaryQueueJob = useCallback((chapterId: number, jobId: number) => {
        const requestId = crypto.randomUUID();
        const summaryRequest: ReaderRequest = {
            id: requestId,
            chapterId,
            jobId,
            type: 'summary',
            query: 'Generate chapter summary',
            sentences: [],
            timestamp: new Date(),
            status: 'pending',
        };

        setRequests(prev => [...prev, summaryRequest]);
        return requestId;
    }, []);

    const resolveSummaryQueueJob = useCallback(
        (jobId: number, status: 'success' | 'error', response: string) => {
            const update = { status, response };
            setRequests(prev => prev.map((request) => (
                request.type === 'summary' && request.jobId === jobId
                    ? { ...request, ...update }
                    : request
            )));
            setSelectedRequest(prev => (
                prev?.type === 'summary' && prev.jobId === jobId
                    ? { ...prev, ...update }
                    : prev
            ));
        },
        [],
    );

    const registerIdeaExplanationQueueJob = useCallback((chapterId: number, ideaTitle: string, jobId: number) => {
        const requestId = crypto.randomUUID();
        const ideaRequest: ReaderRequest = {
            id: requestId,
            chapterId,
            jobId,
            type: 'idea-explain',
            query: `Generate idea explanation: ${ideaTitle}`,
            sentences: [],
            timestamp: new Date(),
            status: 'pending',
        };

        setRequests(prev => [...prev, ideaRequest]);
        return requestId;
    }, []);

    const resolveIdeaExplanationQueueJob = useCallback(
        (jobId: number, status: 'success' | 'error', response: string) => {
            const update = { status, response };
            setRequests(prev => prev.map((request) => (
                request.type === 'idea-explain' && request.jobId === jobId
                    ? { ...request, ...update }
                    : request
            )));
            setSelectedRequest(prev => (
                prev?.type === 'idea-explain' && prev.jobId === jobId
                    ? { ...prev, ...update }
                    : prev
            ));
        },
        [],
    );

    const registerIdeaExtractionQueueJob = useCallback((chapterId: number, jobId: number) => {
        const requestId = crypto.randomUUID();
        const ideaExtractionRequest: ReaderRequest = {
            id: requestId,
            chapterId,
            jobId,
            type: 'idea-extract',
            query: 'Extract key ideas',
            sentences: [],
            timestamp: new Date(),
            status: 'pending',
        };

        setRequests(prev => [...prev, ideaExtractionRequest]);
        return requestId;
    }, []);

    const resolveIdeaExtractionQueueJob = useCallback(
        (jobId: number, status: 'success' | 'error', response: string) => {
            const update = { status, response };
            setRequests(prev => prev.map((request) => (
                request.type === 'idea-extract' && request.jobId === jobId
                    ? { ...request, ...update }
                    : request
            )));
            setSelectedRequest(prev => (
                prev?.type === 'idea-extract' && prev.jobId === jobId
                    ? { ...prev, ...update }
                    : prev
            ));
        },
        [],
    );

    const handleJobCompleted = useCallback(async (jobId: number) => {
        const matchingRequest = requestsRef.current.find(
            (request) => request.type !== 'summary' && request.type !== 'idea-explain' && request.type !== 'idea-extract' && request.jobId === jobId && request.status === 'pending',
        );
        if (!matchingRequest || processingJobIdsRef.current.has(jobId)) {
            return;
        }

        processingJobIdsRef.current.add(jobId);

        try {
            const job = await fetchQueueJob(jobId);

            if (job.status !== 'COMPLETED' || job.resultId == null) {
                const errorMessage = job.errorText?.trim() || 'Chat request failed while processing in queue.';
                setRequests(prev => prev.map(r => r.id === matchingRequest.id ? { ...r, status: 'error' as const, response: errorMessage } : r));
                setSelectedRequest(prev => prev?.id === matchingRequest.id ? { ...prev, status: 'error' as const, response: errorMessage } : prev);
                return;
            }

            const chapterResponses = await fetchChatResponsesForChapter(matchingRequest.chapterId);
            const completedResponse = chapterResponses.find((response) => response.chatResponseId === job.resultId);

            const responseBody = completedResponse?.chatResponse ?? 'Request completed successfully.';

            setRequests(prev => prev.map(r => r.id === matchingRequest.id ? { ...r, status: 'success' as const, response: responseBody } : r));
            setSelectedRequest(prev => prev?.id === matchingRequest.id ? { ...prev, status: 'success' as const, response: responseBody } : prev);
        } catch (error) {
            const errorMessage = getApiErrorMessage(error, 'Failed to resolve queued chat request.');
            setRequests(prev => prev.map(r => r.id === matchingRequest.id ? { ...r, status: 'error' as const, response: errorMessage } : r));
            setSelectedRequest(prev => prev?.id === matchingRequest.id ? { ...prev, status: 'error' as const, response: errorMessage } : prev);
        } finally {
            processingJobIdsRef.current.delete(jobId);
        }
    }, []);

    useJobCompletionSubscription(handleJobCompleted, session.mode === 'online');

    return {
        requests,
        selectedRequest,
        handleRequestExplanation,
        handleSendQuery,
        registerSummaryQueueJob,
        resolveSummaryQueueJob,
        registerIdeaExplanationQueueJob,
        resolveIdeaExplanationQueueJob,
        registerIdeaExtractionQueueJob,
        resolveIdeaExtractionQueueJob,
        openRequest,
        closeRequestModal,
    } as const;
}
