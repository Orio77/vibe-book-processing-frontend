import { useState, useCallback } from 'react';
import { fetchExplanation, fetchChat } from '@/lib/api';
import type { Chapter, Sentence } from '@/types';

export interface ReaderRequest {
    id: string;
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

    const handleRequestExplanation = useCallback(async () => {
        if (!activeChapter) return;

        const reqId = crypto.randomUUID();
        const requestPayload = {
            chapterId: activeChapter.id,
            context: markedSentences.map(s => ({ sentenceId: s.id, sentenceContent: s.content })),
        };

        const newRequest: ReaderRequest = {
            id: reqId,
            type: 'explain',
            sentences: [...markedSentences],
            timestamp: new Date(),
            status: 'pending',
        };

        setRequests(prev => [...prev, newRequest]);
        exitMarkingMode();

        try {
            const response = await fetchExplanation(requestPayload);
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'success' as const, response } : r));
            setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'success' as const, response } : prev);
        } catch (_error) {
            console.error('Failed to fetch explanation:', _error);
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'error' as const, response: 'Failed to fetch explanation.' } : r));
            setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'error' as const, response: 'Failed to fetch explanation.' } : prev);
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
            type: 'query',
            query: queryText,
            sentences: [...markedSentences],
            timestamp: new Date(),
            status: 'pending',
        };

        setRequests(prev => [...prev, newRequest]);
        exitMarkingMode();

        try {
            const response = await fetchChat(requestPayload);
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'success' as const, response } : r));
            setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'success' as const, response } : prev);
        } catch (_error) {
            console.error('Failed to fetch chat response:', _error);
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'error' as const, response: 'Failed to fetch response.' } : r));
            setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'error' as const, response: 'Failed to fetch response.' } : prev);
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

    return {
        requests,
        selectedRequest,
        handleRequestExplanation,
        handleSendQuery,
        openRequest,
        closeRequestModal,
    } as const;
}
