import { useState, useCallback } from 'react';
import { useReaderSession } from '@/context/ReaderSessionContext';
import { getSummaryByChapterId, deleteChapterSummary } from '@/lib/api';
import type { Chapter, ChapterSummary } from '@/types';

/**
 * Manages summary view state for the active chapter.
 * Handles fetch, open/close toggle, and delete.
 */
export function useReaderSummary(activeChapter: Chapter | undefined) {
    const session = useReaderSession();
    const [summaryView, setSummaryView] = useState(false);
    const [summaries, setSummaries] = useState<ChapterSummary[]>([]);
    const [loadingSummary, setLoadingSummary] = useState(false);

    const openSummaryView = useCallback((incoming?: ChapterSummary[]) => {
        if (Array.isArray(incoming)) {
            setSummaries(incoming);
            setSummaryView(true);
            return;
        }
        if (summaryView) {
            setSummaryView(false);
            return;
        }
        if (!activeChapter) return;

        if (session.mode === 'offline') {
            const list = session.bundle.book.summariesByChapterId[activeChapter.id] ?? [];
            setSummaries(list);
            setSummaryView(true);
            return;
        }

        setLoadingSummary(true);
        getSummaryByChapterId(activeChapter.id)
            .then(data => {
                setSummaries(data);
                setSummaryView(true);
            })
            .catch(() => { /* user sees empty state */ })
            .finally(() => setLoadingSummary(false));
    }, [summaryView, activeChapter, session]);

    const closeSummary = useCallback(() => setSummaryView(false), []);

    const syncSummaries = useCallback((incoming: ChapterSummary[]) => {
        setSummaries(incoming);
    }, []);

    const handleDeleteSummary = useCallback(async (summaryId: number) => {
        if (session.mode === 'offline' && activeChapter) {
            session.patchBook((draft) => {
                const cid = activeChapter.id;
                draft.summariesByChapterId[cid] = (draft.summariesByChapterId[cid] ?? []).filter(
                    (s) => s.id !== summaryId,
                );
            });
            setSummaries(prev => {
                const remaining = prev.filter(s => s.id !== summaryId);
                if (remaining.length === 0) setSummaryView(false);
                return remaining;
            });
            return;
        }

        await deleteChapterSummary(summaryId);
        setSummaries(prev => {
            const remaining = prev.filter(s => s.id !== summaryId);
            if (remaining.length === 0) setSummaryView(false);
            return remaining;
        });
    }, [session, activeChapter]);

    return {
        summaryView,
        summaries,
        loadingSummary,
        openSummaryView,
        syncSummaries,
        closeSummary,
        handleDeleteSummary,
    } as const;
}
