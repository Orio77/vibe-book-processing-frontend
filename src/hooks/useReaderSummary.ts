import { useState, useCallback } from 'react';
import { getSummaryByChapterId, deleteChapterSummary } from '@/lib/api';
import type { Chapter, ChapterSummary } from '@/types';

/**
 * Manages summary view state for the active chapter.
 * Handles fetch, open/close toggle, and delete.
 */
export function useReaderSummary(activeChapter: Chapter | undefined) {
    const [summaryView, setSummaryView] = useState(false);
    const [summaries, setSummaries] = useState<ChapterSummary[]>([]);
    const [loadingSummary, setLoadingSummary] = useState(false);

    const openSummaryView = useCallback((incoming?: ChapterSummary[]) => {
        if (incoming) {
            setSummaries(incoming);
            setSummaryView(true);
            return;
        }
        if (summaryView) {
            setSummaryView(false);
            return;
        }
        if (!activeChapter) return;

        setLoadingSummary(true);
        getSummaryByChapterId(activeChapter.id)
            .then(data => {
                setSummaries(data);
                setSummaryView(true);
            })
            .catch(() => { /* user sees empty state */ })
            .finally(() => setLoadingSummary(false));
    }, [summaryView, activeChapter]);

    const closeSummary = useCallback(() => setSummaryView(false), []);

    const handleDeleteSummary = useCallback(async (summaryId: number) => {
        await deleteChapterSummary(summaryId);
        setSummaries(prev => {
            const remaining = prev.filter(s => s.id !== summaryId);
            if (remaining.length === 0) setSummaryView(false);
            return remaining;
        });
    }, []);

    return {
        summaryView,
        summaries,
        loadingSummary,
        openSummaryView,
        closeSummary,
        handleDeleteSummary,
    } as const;
}
