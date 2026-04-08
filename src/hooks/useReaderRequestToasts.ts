import { useEffect, useRef } from 'react';
import type { ToastData } from '@/types';
import type { ReaderRequest } from './useReaderRequests';

function getRequestSuccessMessage(requestType: ReaderRequest['type']) {
    if (requestType === 'summary') return 'Chapter summary is ready.';
    if (requestType === 'idea-explain') return 'Idea explanation is ready.';
    if (requestType === 'idea-extract') return 'Idea extraction is ready.';
    if (requestType === 'ideas-explain') return 'Chapter idea explanations are ready.';
    if (requestType === 'explain') return 'Explanation is ready.';
    return 'Chat response is ready.';
}

function getRequestErrorMessage(requestType: ReaderRequest['type']) {
    if (requestType === 'summary') return 'Chapter summary request failed.';
    if (requestType === 'idea-explain') return 'Idea explanation request failed.';
    if (requestType === 'idea-extract') return 'Idea extraction request failed.';
    if (requestType === 'ideas-explain') return 'Chapter idea explanations request failed.';
    if (requestType === 'explain') return 'Explanation request failed.';
    return 'Chat request failed.';
}

interface UseReaderRequestToastsOptions {
    readonly requests: ReaderRequest[];
    readonly readerViewMode: boolean;
    readonly showToast: (message: string, type: ToastData['type']) => void;
}

export function useReaderRequestToasts({ requests, readerViewMode, showToast }: UseReaderRequestToastsOptions) {
    const completedRequestToastIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        requests.forEach((request) => {
            const isDone = request.status === 'success' || request.status === 'error';
            if (!isDone) return;
            if (completedRequestToastIdsRef.current.has(request.id)) return;

            completedRequestToastIdsRef.current.add(request.id);
            if (readerViewMode) return;

            if (request.status === 'success') {
                showToast(getRequestSuccessMessage(request.type), 'success');
                return;
            }

            showToast(getRequestErrorMessage(request.type), 'error');
        });
    }, [readerViewMode, requests, showToast]);
}
