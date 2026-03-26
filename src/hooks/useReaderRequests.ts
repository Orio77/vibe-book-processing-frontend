import { useState, useCallback, useEffect, useRef } from 'react';
import {
    fetchExplanation,
    fetchChat,
    fetchQueueJob,
    fetchChatResponsesForChapter,
    getApiErrorMessage,
} from '@/lib/api';
import { useJobCompletionSubscription } from './useJobCompletionSubscription';
import type { Chapter, Sentence } from '@/types';

export interface ReaderRequest {
    id: string;
    chapterId: number;
    jobId?: number;
    type: 'explain' | 'query';
    query?: string;
    sentences: Sentence[];
    timestamp: Date;
    status: 'pending' | 'success' | 'error';
    response?: string;
}

/**
 * Manages in-memory AI request history (explanations + chat queries).
 * Sends requests and tracks their lifecycle.
 */
export function useReaderRequests(
    activeChapter: Chapter | undefined,
    markedSentences: Sentence[],
    exitMarkingMode: () => void,
) {
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
        const requestPayload = {
            chapterId: activeChapter.id,
            query: '',
            context: markedSentences.map(s => ({ sentenceId: s.id, sentenceContent: s.content })),
        };

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
    }, [activeChapter, markedSentences, exitMarkingMode]);

    const handleSendQuery = useCallback(async (queryText: string) => {
        if (!queryText.trim() || !activeChapter) return;

        const reqId = crypto.randomUUID();
        const requestPayload = {
            chapterId: activeChapter.id,
            query: queryText,
            context: markedSentences.map(s => ({ sentenceId: s.id, sentenceContent: s.content })),
        };

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
    }, [activeChapter, markedSentences, exitMarkingMode]);

    const openRequest = useCallback((requestId: string) => {
        setSelectedRequest((current) => {
            if (current?.id === requestId) {
                return current;
            }

            return requests.find((request) => request.id === requestId) ?? null;
        });
    }, [requests]);

    const closeRequestModal = useCallback(() => setSelectedRequest(null), []);

    const handleJobCompleted = useCallback(async (jobId: number) => {
        const matchingRequest = requestsRef.current.find((request) => request.jobId === jobId && request.status === 'pending');
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

    useJobCompletionSubscription(handleJobCompleted);

    return {
        requests,
        selectedRequest,
        handleRequestExplanation,
        handleSendQuery,
        openRequest,
        closeRequestModal,
    } as const;
}
