import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { ReaderViewScrollMode } from '@/types';

const PAGE_FLIP_PULL_THRESHOLD = 120;

type PageFlipDirection = 'forward' | 'backward';

type PullIndicatorState = {
    active: boolean;
    direction: PageFlipDirection | null;
    progress: number;
};

interface UseReaderPageFlipGestureOptions {
    readonly readerViewMode: boolean;
    readonly pageFlipEnabled: boolean;
    readonly scrollMode: ReaderViewScrollMode;
    readonly canGoBackward: boolean;
    readonly canGoForward: boolean;
    readonly onFlipDirection: (direction: PageFlipDirection) => void;
}

export function useReaderPageFlipGesture({
    readerViewMode,
    pageFlipEnabled,
    scrollMode,
    canGoBackward,
    canGoForward,
    onFlipDirection,
}: UseReaderPageFlipGestureOptions) {
    const [pullIndicator, setPullIndicator] = useState<PullIndicatorState>({
        active: false,
        direction: null,
        progress: 0,
    });

    const readerViewContainerRef = useRef<HTMLDivElement | null>(null);
    const pullGestureRef = useRef<{
        pointerId: number | null;
        startX: number;
        startY: number;
        canForward: boolean;
        canBackward: boolean;
        active: boolean;
    }>({
        pointerId: null,
        startX: 0,
        startY: 0,
        canForward: false,
        canBackward: false,
        active: false,
    });

    const isHorizontalReaderScroll = scrollMode === 'horizontal';

    const resetPullState = useCallback(() => {
        pullGestureRef.current = {
            pointerId: null,
            startX: 0,
            startY: 0,
            canForward: false,
            canBackward: false,
            active: false,
        };
        setPullIndicator({ active: false, direction: null, progress: 0 });
    }, []);

    useEffect(() => {
        if (!readerViewMode) {
            resetPullState();
        }
    }, [readerViewMode, resetPullState]);

    const resolvePullDirection = (delta: number, canBackwardPull: boolean, canForwardPull: boolean): PageFlipDirection | null => {
        if (delta > 0 && canBackwardPull) return 'backward';
        if (delta < 0 && canForwardPull) return 'forward';
        return null;
    };

    const handleReaderPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!pageFlipEnabled || event.pointerType !== 'touch') return;

        const container = readerViewContainerRef.current;
        if (!container) return;

        const maxVerticalScroll = Math.max(0, container.scrollHeight - container.clientHeight);
        const maxHorizontalScroll = Math.max(0, container.scrollWidth - container.clientWidth);
        const canBackwardPull = isHorizontalReaderScroll
            ? container.scrollLeft <= 2 && canGoBackward
            : container.scrollTop <= 2 && canGoBackward;
        const canForwardPull = isHorizontalReaderScroll
            ? container.scrollLeft >= maxHorizontalScroll - 2 && canGoForward
            : container.scrollTop >= maxVerticalScroll - 2 && canGoForward;

        pullGestureRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            canForward: canForwardPull,
            canBackward: canBackwardPull,
            active: canForwardPull || canBackwardPull,
        };

        if (canForwardPull || canBackwardPull) {
            event.currentTarget.setPointerCapture(event.pointerId);
        }
    };

    const handleReaderPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const pull = pullGestureRef.current;
        if (!pull.active || pull.pointerId !== event.pointerId) return;

        const delta = isHorizontalReaderScroll
            ? event.clientX - pull.startX
            : event.clientY - pull.startY;

        const direction = resolvePullDirection(delta, pull.canBackward, pull.canForward);
        if (!direction) {
            setPullIndicator({ active: false, direction: null, progress: 0 });
            return;
        }

        const progress = Math.min(1, Math.abs(delta) / PAGE_FLIP_PULL_THRESHOLD);
        setPullIndicator({ active: true, direction, progress });
        event.preventDefault();
    };

    const handleReaderPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
        const pull = pullGestureRef.current;
        if (!pull.active || pull.pointerId !== event.pointerId) return;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        const shouldFlip = pullIndicator.active && pullIndicator.direction !== null && pullIndicator.progress >= 1;
        const direction = pullIndicator.direction;
        resetPullState();

        if (shouldFlip && direction) {
            onFlipDirection(direction);
        }
    };

    const shouldShowEdgeClickZones = pageFlipEnabled;

    let pullIndicatorPositionClassName = '';
    if (pullIndicator.direction !== null) {
        if (isHorizontalReaderScroll) {
            pullIndicatorPositionClassName = pullIndicator.direction === 'forward'
                ? 'right-6 top-1/2 -translate-y-1/2'
                : 'left-6 top-1/2 -translate-y-1/2';
        } else {
            pullIndicatorPositionClassName = pullIndicator.direction === 'forward'
                ? 'bottom-6 left-1/2 -translate-x-1/2'
                : 'top-6 left-1/2 -translate-x-1/2';
        }
    }

    return {
        isHorizontalReaderScroll,
        readerViewContainerRef,
        pullIndicator,
        pullIndicatorPositionClassName,
        shouldShowEdgeClickZones,
        handleReaderPointerDown,
        handleReaderPointerMove,
        handleReaderPointerEnd,
    } as const;
}
