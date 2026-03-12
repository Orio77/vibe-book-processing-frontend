import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchChatResponsesForChapter, updateChatResponse, deleteChatResponse } from '@/lib/api';
import type { Chapter, Sentence, PDFChatResponse } from '@/types';

/**
 * Manages chat-response overlays for the active chapter.
 * Fetches responses when enabled, handles highlight/select state,
 * and provides edit/delete handlers.
 */
export function useReaderChat(
    activeChapter: Chapter | undefined,
    sentences: Sentence[],
) {
    const [showChat, setShowChat] = useState(false);
    const [chatResponses, setChatResponses] = useState<PDFChatResponse[]>([]);
    const [loadingChat, setLoadingChat] = useState(false);
    const [highlightedSentenceIds, setHighlightedSentenceIds] = useState<Set<number>>(new Set());
    const [selectedChatResponse, setSelectedChatResponse] = useState<PDFChatResponse | null>(null);
    const [highlightedChatResponseIdx, setHighlightedChatResponseIdx] = useState<string | null>(null);

    // Fetch chat responses when enabled — with cancellation guard.
    // setLoadingChat(true) happens in toggleChat to avoid setState-in-effect.
    useEffect(() => {
        if (!showChat || !activeChapter) {
            return;
        }

        let cancelled = false;

        fetchChatResponsesForChapter(activeChapter.id)
            .then(data => { if (!cancelled) setChatResponses(data); })
            .catch((_error) => {
                console.error('Failed to load chat responses:', _error);
                if (!cancelled) setChatResponses([]);
            })
            .finally(() => { if (!cancelled) setLoadingChat(false); });

        return () => { cancelled = true; };
    }, [showChat, activeChapter]);

    // Reset overlay state when chat is toggled off or chapter changes
    const toggleChat = useCallback(() => {
        setShowChat(prev => {
            if (prev) {
                // turning off — clear all chat overlay state
                setChatResponses([]);
                setHighlightedSentenceIds(new Set());
                setHighlightedChatResponseIdx(null);
                setLoadingChat(false);
            } else {
                // turning on — set loading before the effect fires
                setLoadingChat(true);
            }
            return !prev;
        });
    }, []);

    /** Map sentence ids → chat responses for placing icons at run boundaries */
    const sentenceChatIconMap = useMemo(() => {
        const groupKey = (ids: number[]) => [...ids].sort((a, b) => a - b).join(',');
        const groupMap = new Map<string, PDFChatResponse[]>();

        chatResponses.forEach(cr => {
            const key = groupKey(cr.contextSentencesIds);
            const list = groupMap.get(key) || [];
            list.push(cr);
            groupMap.set(key, list);
        });

        const sentenceIds = sentences.map(s => s.id);
        const result = new Map<number, PDFChatResponse[]>();

        groupMap.forEach((responses) => {
            const contextSet = new Set(responses[0].contextSentencesIds);
            let runEnd: number | null = null;

            sentenceIds.forEach((sid, idx) => {
                const inGroup = contextSet.has(sid);
                const nextInGroup = contextSet.has(sentenceIds[idx + 1] ?? -1);
                if (inGroup) {
                    runEnd = sid;
                    if (!nextInGroup) {
                        result.set(runEnd, responses);
                        runEnd = null;
                    }
                }
            });
        });

        return result;
    }, [chatResponses, sentences]);

    const handleChatIconClick = useCallback(
        (cr: PDFChatResponse, sentenceId: number, idx: number) => {
            const key = `icon_${sentenceId}_${idx}`;
            if (highlightedChatResponseIdx === key) {
                setSelectedChatResponse(cr);
                setHighlightedSentenceIds(new Set());
                setHighlightedChatResponseIdx(null);
            } else {
                setHighlightedSentenceIds(new Set(cr.contextSentencesIds));
                setHighlightedChatResponseIdx(key);
                setSelectedChatResponse(null);
            }
        },
        [highlightedChatResponseIdx],
    );

    const handleDeleteChatResponse = useCallback(async (id: number) => {
        await deleteChatResponse(id);
        setChatResponses(prev => prev.filter(cr => cr.chatResponseId !== id));
        setHighlightedSentenceIds(new Set());
        setHighlightedChatResponseIdx(null);
    }, []);

    const handleSaveChatResponse = useCallback(async (id: number, newText: string) => {
        const updated = await updateChatResponse(id, newText);
        setChatResponses(prev => prev.map(cr => cr.chatResponseId === id ? updated : cr));
        setSelectedChatResponse(updated);
    }, []);

    const closeChatModal = useCallback(() => setSelectedChatResponse(null), []);

    return {
        showChat,
        chatResponses,
        loadingChat,
        highlightedSentenceIds,
        selectedChatResponse,
        highlightedChatResponseIdx,
        sentenceChatIconMap,
        toggleChat,
        handleChatIconClick,
        handleDeleteChatResponse,
        handleSaveChatResponse,
        closeChatModal,
    } as const;
}
