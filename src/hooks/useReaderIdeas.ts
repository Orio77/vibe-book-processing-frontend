import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchIdeasByChapterId } from '@/lib/api';
import type { Chapter, IdeaWithSentences } from '@/types';

/**
 * Manages idea overlays for the active chapter.
 * Fetches ideas when enabled and maps sentences → ideas for rendering.
 */
export function useReaderIdeas(activeChapter: Chapter | undefined) {
    const [showIdeas, setShowIdeas] = useState(false);
    const [ideas, setIdeas] = useState<IdeaWithSentences[]>([]);
    const [loadingIdeas, setLoadingIdeas] = useState(false);
    const [selectedIdeas, setSelectedIdeas] = useState<IdeaWithSentences[] | null>(null);

    // Fetch ideas when panel is enabled and chapter is available.
    // All synchronous state resets happen in toggleIdeas to avoid setState-in-effect.
    useEffect(() => {
        if (!showIdeas || !activeChapter) return;

        let cancelled = false;

        fetchIdeasByChapterId(activeChapter.id)
            .then(data => { if (!cancelled) setIdeas(data); })
            .catch(() => { if (!cancelled) setIdeas([]); })
            .finally(() => { if (!cancelled) setLoadingIdeas(false); });

        return () => { cancelled = true; };
    }, [showIdeas, activeChapter]);

    /** Maps each sentence id → the ideas that reference it */
    const sentenceIdeasMap = useMemo(() => {
        const map = new Map<number, IdeaWithSentences[]>();
        ideas.forEach(ideaWithSentences => {
            ideaWithSentences.sentences.forEach(s => {
                const list = map.get(s.sentenceId) || [];
                list.push(ideaWithSentences);
                map.set(s.sentenceId, list);
            });
        });
        return map;
    }, [ideas]);

    const toggleIdeas = useCallback(() => {
        setShowIdeas(prev => {
            if (prev) {
                // Turning off — clear all idea state
                setIdeas([]);
                setLoadingIdeas(false);
            } else {
                // Turning on — set loading before the effect fires
                setLoadingIdeas(true);
            }
            return !prev;
        });
    }, []);

    const handleIdeaClick = useCallback(
        (sentenceIdeas: IdeaWithSentences[]) => setSelectedIdeas(sentenceIdeas),
        [],
    );

    const closeIdeaModal = useCallback(() => setSelectedIdeas(null), []);

    return {
        showIdeas,
        ideas,
        loadingIdeas,
        selectedIdeas,
        sentenceIdeasMap,
        toggleIdeas,
        handleIdeaClick,
        closeIdeaModal,
    } as const;
}
