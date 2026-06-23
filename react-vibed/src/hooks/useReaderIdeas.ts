import { useState, useEffect, useMemo, useCallback } from 'react';
import { useReaderSession } from '@/context/ReaderSessionContext';
import { fetchIdeasByChapterId } from '@/lib/api';
import type { Chapter, IdeaWithSentences } from '@/types';

/**
 * Manages idea overlays for the active chapter.
 * Fetches ideas when enabled and maps sentences → ideas for rendering.
 */
export function useReaderIdeas(activeChapter: Chapter | undefined) {
    const session = useReaderSession();
    const [showIdeas, setShowIdeas] = useState(false);
    const [ideas, setIdeas] = useState<IdeaWithSentences[]>([]);
    const [loadingIdeas, setLoadingIdeas] = useState(false);
    const [selectedIdeas, setSelectedIdeas] = useState<IdeaWithSentences[] | null>(null);

    useEffect(() => {
        if (!showIdeas || !activeChapter) return;

        let cancelled = false;

        if (session.mode === 'offline') {
            const data = session.bundle.book.ideasByChapterId[activeChapter.id] ?? [];
            if (!cancelled) {
                setIdeas(data);
                setLoadingIdeas(false);
            }
            return () => { cancelled = true; };
        }

        fetchIdeasByChapterId(activeChapter.id)
            .then(data => { if (!cancelled) setIdeas(data); })
            .catch(() => { if (!cancelled) setIdeas([]); })
            .finally(() => { if (!cancelled) setLoadingIdeas(false); });

        return () => { cancelled = true; };
    }, [showIdeas, activeChapter, session]);

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
                setIdeas([]);
                setLoadingIdeas(false);
            } else {
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
