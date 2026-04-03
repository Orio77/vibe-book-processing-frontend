import { useState, useCallback, useEffect, useRef } from 'react';
import { useReaderSession, type ReaderSession } from '@/context/ReaderSessionContext';
import {
    fetchExplanation,
    fetchChat,
    fetchQueueJob,
    fetchChatResponsesForChapter,
    fetchIdeaExplanations,
    getApiErrorMessage,
} from '@/lib/api';
import {
    addPendingReaderJob,
    readPendingJobsForPdf,
    removePendingReaderJob,
    type PersistedReaderQueueEntry,
} from '@/lib/readerQueuePersistence';
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
    type: 'explain' | 'query' | 'summary' | 'idea-explain' | 'idea-extract' | 'ideas-explain';
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

export interface RehydratedToolJobs {
    readonly summaryJobs: { jobId: number; chapterId: number }[];
    readonly ideaExtractJobs: { jobId: number; chapterId: number }[];
    readonly ideasExplainJobs: { jobId: number; chapterId: number }[];
}

export interface RehydratedIdeaExplanationJob {
    readonly jobId: number;
    readonly ideaId: number;
}

function buildPersistedEntry(
    partial: Omit<PersistedReaderQueueEntry, 'createdAt'>,
): PersistedReaderQueueEntry {
    return { ...partial, createdAt: new Date().toISOString() };
}

function entryToReaderRequest(entry: PersistedReaderQueueEntry): ReaderRequest {
    const sentences: Sentence[] = (entry.contextSentenceIds ?? []).map((id) => ({
        id,
        content: '',
        sentenceIndex: 0,
        pdfId: entry.pdfId,
        chapterId: entry.chapterId,
    }));

    return {
        id: `rehydrated-job-${entry.jobId}`,
        chapterId: entry.chapterId,
        jobId: entry.jobId,
        type: entry.kind,
        query: entry.queryLabel,
        sentences,
        timestamp: new Date(entry.createdAt),
        status: 'pending',
    };
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
    options?: {
        readonly pdfId?: number;
        readonly onlinePersistence?: boolean;
        readonly onSummaryJobSettled?: (chapterId: number) => Promise<void>;
    },
) {
    const session = useReaderSession();
    const pdfId = options?.pdfId;
    const onlinePersistence = options?.onlinePersistence === true && session.mode === 'online';
    const onSummaryJobSettled = options?.onSummaryJobSettled;

    const [requests, setRequests] = useState<ReaderRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<ReaderRequest | null>(null);
    const [rehydratedToolJobs, setRehydratedToolJobs] = useState<RehydratedToolJobs>({
        summaryJobs: [],
        ideaExtractJobs: [],
        ideasExplainJobs: [],
    });
    const [rehydratedIdeaExplanationJobs, setRehydratedIdeaExplanationJobs] = useState<RehydratedIdeaExplanationJob[]>([]);
    const requestsRef = useRef<ReaderRequest[]>([]);
    const processingJobIdsRef = useRef<Set<number>>(new Set());
    const onSummaryJobSettledRef = useRef(onSummaryJobSettled);
    onSummaryJobSettledRef.current = onSummaryJobSettled;

    useEffect(() => {
        requestsRef.current = requests;
    }, [requests]);

    useEffect(() => {
        if (!pdfId || !onlinePersistence) {
            return;
        }

        let cancelled = false;

        const run = async () => {
            setRehydratedToolJobs({ summaryJobs: [], ideaExtractJobs: [], ideasExplainJobs: [] });
            setRehydratedIdeaExplanationJobs([]);

            const entries = readPendingJobsForPdf(pdfId);
            const toolSnapshot: RehydratedToolJobs = {
                summaryJobs: [],
                ideaExtractJobs: [],
                ideasExplainJobs: [],
            };
            const ideaExplainSnapshot: RehydratedIdeaExplanationJob[] = [];

            for (const entry of entries) {
                if (cancelled) break;

                let job: Awaited<ReturnType<typeof fetchQueueJob>>;
                try {
                    job = await fetchQueueJob(entry.jobId);
                } catch {
                    continue;
                }

                const stillQueued = job.status === 'PENDING' || job.status === 'BEING_MODIFIED';

                if (stillQueued) {
                    setRequests((prev) => {
                        if (prev.some((r) => r.jobId === entry.jobId)) return prev;
                        return [...prev, entryToReaderRequest(entry)];
                    });

                    if (entry.kind === 'summary') {
                        toolSnapshot.summaryJobs.push({ jobId: entry.jobId, chapterId: entry.chapterId });
                    } else if (entry.kind === 'idea-extract') {
                        toolSnapshot.ideaExtractJobs.push({ jobId: entry.jobId, chapterId: entry.chapterId });
                    } else if (entry.kind === 'ideas-explain') {
                        toolSnapshot.ideasExplainJobs.push({ jobId: entry.jobId, chapterId: entry.chapterId });
                    } else if (entry.kind === 'idea-explain' && entry.ideaId != null) {
                        ideaExplainSnapshot.push({ jobId: entry.jobId, ideaId: entry.ideaId });
                    }
                    continue;
                }

                removePendingReaderJob(entry.jobId);

                const fail = (message: string) => {
                    setRequests((prev) => {
                        const existing = prev.find((r) => r.jobId === entry.jobId);
                        if (existing) {
                            return prev.map((r) => (
                                r.jobId === entry.jobId
                                    ? { ...r, status: 'error' as const, response: message }
                                    : r
                            ));
                        }
                        return [...prev, {
                            ...entryToReaderRequest(entry),
                            status: 'error' as const,
                            response: message,
                        }];
                    });
                    setSelectedRequest((prev) => (
                        prev?.jobId === entry.jobId
                            ? { ...prev, status: 'error' as const, response: message }
                            : prev
                    ));
                };

                if (entry.kind === 'explain' || entry.kind === 'query') {
                    if (job.status !== 'COMPLETED' || job.resultId == null) {
                        fail(job.errorText?.trim() || 'Request failed while processing in queue.');
                        continue;
                    }
                    try {
                        const chapterResponses = await fetchChatResponsesForChapter(entry.chapterId);
                        const completedResponse = chapterResponses.find((r) => r.chatResponseId === job.resultId);
                        const body = completedResponse?.chatResponse ?? 'Request completed successfully.';
                        setRequests((prev) => {
                            const existing = prev.find((r) => r.jobId === entry.jobId);
                            if (existing) {
                                return prev.map((r) => (
                                    r.jobId === entry.jobId
                                        ? { ...r, status: 'success' as const, response: body }
                                        : r
                                ));
                            }
                            return [...prev, {
                                ...entryToReaderRequest(entry),
                                status: 'success' as const,
                                response: body,
                            }];
                        });
                        setSelectedRequest((prev) => (
                            prev?.jobId === entry.jobId
                                ? { ...prev, status: 'success' as const, response: body }
                                : prev
                        ));
                    } catch (error) {
                        fail(getApiErrorMessage(error, 'Failed to load completed chat response.'));
                    }
                    continue;
                }

                if (entry.kind === 'summary') {
                    if (job.status !== 'COMPLETED') {
                        fail(job.errorText?.trim() || 'Chapter summary generation failed.');
                        continue;
                    }
                    try {
                        await onSummaryJobSettledRef.current?.(entry.chapterId);
                        setRequests((prev) => {
                            const existing = prev.find((r) => r.jobId === entry.jobId);
                            if (existing) {
                                return prev.map((r) => (
                                    r.jobId === entry.jobId
                                        ? {
                                            ...r,
                                            status: 'success' as const,
                                            response: 'Chapter summary is ready.',
                                        }
                                        : r
                                ));
                            }
                            return [...prev, {
                                ...entryToReaderRequest(entry),
                                status: 'success' as const,
                                response: 'Chapter summary is ready.',
                            }];
                        });
                    } catch (error) {
                        fail(getApiErrorMessage(error, 'Failed to refresh chapter summary after queue.'));
                    }
                    continue;
                }

                if (entry.kind === 'idea-extract' || entry.kind === 'ideas-explain') {
                    if (job.status !== 'COMPLETED') {
                        fail(job.errorText?.trim() || 'Request failed while processing in queue.');
                        continue;
                    }
                    const message = entry.kind === 'idea-extract'
                        ? 'Key ideas have been extracted.'
                        : 'Explanations for chapter ideas are ready.';
                    setRequests((prev) => {
                        const existing = prev.find((r) => r.jobId === entry.jobId);
                        if (existing) {
                            return prev.map((r) => (
                                r.jobId === entry.jobId
                                    ? { ...r, status: 'success' as const, response: message }
                                    : r
                            ));
                        }
                        return [...prev, {
                            ...entryToReaderRequest(entry),
                            status: 'success' as const,
                            response: message,
                        }];
                    });
                    continue;
                }

                if (entry.kind === 'idea-explain') {
                    if (job.status !== 'COMPLETED' || entry.ideaId == null) {
                        fail(job.errorText?.trim() || 'Could not generate explanation right now. Please try again.');
                        continue;
                    }
                    try {
                        const refreshed = await fetchIdeaExplanations(entry.ideaId);
                        const resultId = job.resultId ?? null;
                        const resolved = resultId == null
                            ? refreshed[0]
                            : refreshed.find((item) => item.id === resultId) ?? refreshed[0];
                        if (!resolved) {
                            fail('Explanation finished but no content was returned.');
                            continue;
                        }
                        const body = resolved.text ?? 'Idea explanation generated.';
                        setRequests((prev) => {
                            const existing = prev.find((r) => r.jobId === entry.jobId);
                            if (existing) {
                                return prev.map((r) => (
                                    r.jobId === entry.jobId
                                        ? { ...r, status: 'success' as const, response: body }
                                        : r
                                ));
                            }
                            return [...prev, {
                                ...entryToReaderRequest(entry),
                                status: 'success' as const,
                                response: body,
                            }];
                        });
                    } catch (error) {
                        fail(getApiErrorMessage(error, 'Could not resolve explanation after queue.'));
                    }
                }
            }

            if (!cancelled) {
                setRehydratedToolJobs(toolSnapshot);
                setRehydratedIdeaExplanationJobs(ideaExplainSnapshot);
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [pdfId, onlinePersistence]);

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
                if (onlinePersistence && activeChapter) {
                    addPendingReaderJob(buildPersistedEntry({
                        jobId: result.jobId,
                        pdfId: activeChapter.pdfId,
                        chapterId: activeChapter.id,
                        kind: 'explain',
                        queryLabel: 'Explanation request',
                        contextSentenceIds: markedSentences.map((s) => s.id),
                    }));
                }
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
    }, [activeChapter, markedSentences, exitMarkingMode, session, bookTitle, onlinePersistence]);

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
                if (onlinePersistence && activeChapter) {
                    addPendingReaderJob(buildPersistedEntry({
                        jobId: result.jobId,
                        pdfId: activeChapter.pdfId,
                        chapterId: activeChapter.id,
                        kind: 'query',
                        queryLabel: queryText,
                        contextSentenceIds: markedSentences.map((s) => s.id),
                    }));
                }
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
    }, [activeChapter, markedSentences, exitMarkingMode, session, bookTitle, onlinePersistence]);

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
        if (onlinePersistence && pdfId != null) {
            addPendingReaderJob(buildPersistedEntry({
                jobId,
                pdfId,
                chapterId,
                kind: 'summary',
                queryLabel: 'Generate chapter summary',
            }));
        }
        return requestId;
    }, [onlinePersistence, pdfId]);

    const resolveSummaryQueueJob = useCallback(
        (jobId: number, status: 'success' | 'error', response: string) => {
            removePendingReaderJob(jobId);
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

    const registerIdeaExplanationQueueJob = useCallback((chapterId: number, ideaTitle: string, jobId: number, ideaId: number) => {
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
        if (onlinePersistence && pdfId != null) {
            addPendingReaderJob(buildPersistedEntry({
                jobId,
                pdfId,
                chapterId,
                kind: 'idea-explain',
                queryLabel: `Generate idea explanation: ${ideaTitle}`,
                ideaId,
            }));
        }
        return requestId;
    }, [onlinePersistence, pdfId]);

    const resolveIdeaExplanationQueueJob = useCallback(
        (jobId: number, status: 'success' | 'error', response: string) => {
            removePendingReaderJob(jobId);
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
        if (onlinePersistence && pdfId != null) {
            addPendingReaderJob(buildPersistedEntry({
                jobId,
                pdfId,
                chapterId,
                kind: 'idea-extract',
                queryLabel: 'Extract key ideas',
            }));
        }
        return requestId;
    }, [onlinePersistence, pdfId]);

    const registerIdeasExplanationQueueJob = useCallback((chapterId: number, jobId: number) => {
        const requestId = crypto.randomUUID();
        const ideasExplanationRequest: ReaderRequest = {
            id: requestId,
            chapterId,
            jobId,
            type: 'ideas-explain',
            query: 'Generate explanations for all key ideas',
            sentences: [],
            timestamp: new Date(),
            status: 'pending',
        };

        setRequests(prev => [...prev, ideasExplanationRequest]);
        if (onlinePersistence && pdfId != null) {
            addPendingReaderJob(buildPersistedEntry({
                jobId,
                pdfId,
                chapterId,
                kind: 'ideas-explain',
                queryLabel: 'Generate explanations for all key ideas',
            }));
        }
        return requestId;
    }, [onlinePersistence, pdfId]);

    const resolveIdeaExtractionQueueJob = useCallback(
        (jobId: number, status: 'success' | 'error', response: string) => {
            removePendingReaderJob(jobId);
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

    const resolveIdeasExplanationQueueJob = useCallback(
        (jobId: number, status: 'success' | 'error', response: string) => {
            removePendingReaderJob(jobId);
            const update = { status, response };
            setRequests(prev => prev.map((request) => (
                request.type === 'ideas-explain' && request.jobId === jobId
                    ? { ...request, ...update }
                    : request
            )));
            setSelectedRequest(prev => (
                prev?.type === 'ideas-explain' && prev.jobId === jobId
                    ? { ...prev, ...update }
                    : prev
            ));
        },
        [],
    );

    const handleJobCompleted = useCallback(async (jobId: number) => {
        const matchingRequest = requestsRef.current.find(
            (request) => request.type !== 'summary' && request.type !== 'idea-explain' && request.type !== 'idea-extract' && request.type !== 'ideas-explain' && request.jobId === jobId && request.status === 'pending',
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
            removePendingReaderJob(jobId);
            processingJobIdsRef.current.delete(jobId);
        }
    }, []);

    useJobCompletionSubscription(handleJobCompleted, session.mode === 'online');

    return {
        requests,
        selectedRequest,
        rehydratedToolJobs,
        rehydratedIdeaExplanationJobs,
        handleRequestExplanation,
        handleSendQuery,
        registerSummaryQueueJob,
        resolveSummaryQueueJob,
        registerIdeaExplanationQueueJob,
        resolveIdeaExplanationQueueJob,
        registerIdeaExtractionQueueJob,
        resolveIdeaExtractionQueueJob,
        registerIdeasExplanationQueueJob,
        resolveIdeasExplanationQueueJob,
        openRequest,
        closeRequestModal,
    } as const;
}
