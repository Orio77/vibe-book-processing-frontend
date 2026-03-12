import { useState, useRef, useCallback, useMemo } from 'react';
import type { Sentence } from '@/types';

/**
 * Encapsulates all sentence-marking interaction state:
 * marking mode toggle, long-press / drag selection, pointer events.
 */
export function useSentenceMarking(sentences: Sentence[]) {
    const [isMarkingMode, setIsMarkingMode] = useState(false);
    const [markedSentences, setMarkedSentences] = useState<Sentence[]>([]);
    const [showQueryBox, setShowQueryBox] = useState(false);
    const [queryText, setQueryText] = useState('');

    const holdTimeoutRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);
    const dragVisitedRef = useRef<Set<number>>(new Set());
    const dragActionRef = useRef<'mark' | 'unmark' | null>(null);

    const sentenceByIdMap = useMemo(
        () => new Map(sentences.map(s => [s.id, s])),
        [sentences],
    );

    // ── helpers ──

    const addSentenceToMarked = useCallback((s: Sentence) => {
        setMarkedSentences(prev =>
            prev.some(m => m.id === s.id) ? prev : [...prev, s],
        );
    }, []);

    const removeSentenceFromMarked = useCallback((s: Sentence) => {
        setMarkedSentences(prev => {
            const newMarks = prev.filter(m => m.id !== s.id);
            if (newMarks.length === 0) {
                setIsMarkingMode(false);
                setShowQueryBox(false);
            }
            return newMarks;
        });
    }, []);

    const applyDragAction = useCallback(
        (s: Sentence, action: 'mark' | 'unmark') => {
            if (dragVisitedRef.current.has(s.id)) return;
            dragVisitedRef.current.add(s.id);
            if (action === 'mark') {
                addSentenceToMarked(s);
            } else {
                removeSentenceFromMarked(s);
            }
        },
        [addSentenceToMarked, removeSentenceFromMarked],
    );

    const resetDragState = useCallback(() => {
        isDraggingRef.current = false;
        dragVisitedRef.current.clear();
        dragActionRef.current = null;
        if (holdTimeoutRef.current !== null) {
            globalThis.clearTimeout(holdTimeoutRef.current);
            holdTimeoutRef.current = null;
        }
    }, []);

    const exitMarkingMode = useCallback(() => {
        setIsMarkingMode(false);
        setMarkedSentences([]);
        setShowQueryBox(false);
        setQueryText('');
    }, []);

    const toggleSentenceMark = useCallback(
        (s: Sentence) => {
            if (markedSentences.some(m => m.id === s.id)) {
                removeSentenceFromMarked(s);
            } else {
                addSentenceToMarked(s);
            }
        },
        [markedSentences, addSentenceToMarked, removeSentenceFromMarked],
    );

    // ── pointer event handlers ──

    const handlePointerDown = useCallback(
        (e: React.PointerEvent, s: Sentence) => {
            const target = e.currentTarget as HTMLElement;
            const firstSentenceMarked = markedSentences.some(m => m.id === s.id);

            if (isMarkingMode) {
                isDraggingRef.current = true;
                dragVisitedRef.current.clear();
                dragActionRef.current = firstSentenceMarked ? 'unmark' : 'mark';
                target.setPointerCapture?.(e.pointerId);
                applyDragAction(s, dragActionRef.current);
                return;
            }

            holdTimeoutRef.current = globalThis.setTimeout(() => {
                holdTimeoutRef.current = null;
                isDraggingRef.current = true;
                dragVisitedRef.current.clear();
                dragActionRef.current = firstSentenceMarked ? 'unmark' : 'mark';
                setIsMarkingMode(true);
                target.setPointerCapture?.(e.pointerId);
                applyDragAction(s, dragActionRef.current);
                globalThis.navigator?.vibrate?.(50);
            }, 500);
        },
        [isMarkingMode, markedSentences, applyDragAction],
    );

    const handlePointerUp = useCallback(() => resetDragState(), [resetDragState]);
    const handlePointerCancel = useCallback(() => resetDragState(), [resetDragState]);

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!isMarkingMode || !isDraggingRef.current || !dragActionRef.current) return;

            const element = document.elementFromPoint(e.clientX, e.clientY);
            const sentenceEl = element?.closest('[data-sentence-id]');
            if (!sentenceEl) return;
            const sentenceNode = sentenceEl as HTMLElement;

            const sentenceIdValue = sentenceNode.dataset.sentenceId;
            if (!sentenceIdValue) return;

            const sentenceId = Number.parseInt(sentenceIdValue, 10);
            if (Number.isNaN(sentenceId)) return;

            const sentence = sentenceByIdMap.get(sentenceId);
            if (!sentence) return;

            applyDragAction(sentence, dragActionRef.current);
        },
        [isMarkingMode, sentenceByIdMap, applyDragAction],
    );

    const handlePointerEnter = useCallback(
        (s: Sentence) => {
            if (isMarkingMode && isDraggingRef.current && dragActionRef.current) {
                applyDragAction(s, dragActionRef.current);
            }
        },
        [isMarkingMode, applyDragAction],
    );

    const handleSentenceKeyDown = useCallback(
        (e: React.KeyboardEvent, s: Sentence) => {
            if (!isMarkingMode) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSentenceMark(s);
            }
        },
        [isMarkingMode, toggleSentenceMark],
    );

    return {
        isMarkingMode,
        markedSentences,
        showQueryBox,
        queryText,
        setShowQueryBox,
        setQueryText,
        exitMarkingMode,
        handlePointerDown,
        handlePointerUp,
        handlePointerCancel,
        handlePointerMove,
        handlePointerEnter,
        handleSentenceKeyDown,
    } as const;
}
