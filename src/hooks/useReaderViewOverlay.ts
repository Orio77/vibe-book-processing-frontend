import { useCallback, useEffect, useRef, useState } from 'react';

interface UseReaderViewOverlayOptions {
    readonly onEnterReaderView: () => void;
}

export function useReaderViewOverlay({ onEnterReaderView }: UseReaderViewOverlayOptions) {
    const [readerViewMode, setReaderViewMode] = useState(false);
    const readerViewHistoryEntryRef = useRef(false);
    const suppressReaderViewPopStateRef = useRef(false);

    const exitReaderView = useCallback(() => {
        setReaderViewMode(false);
        if (readerViewHistoryEntryRef.current) {
            suppressReaderViewPopStateRef.current = true;
            readerViewHistoryEntryRef.current = false;
            globalThis.history.back();
        }
    }, []);

    const toggleReaderView = useCallback(() => {
        if (readerViewMode) {
            exitReaderView();
            return;
        }

        onEnterReaderView();
        setReaderViewMode(true);
    }, [readerViewMode, exitReaderView, onEnterReaderView]);

    useEffect(() => {
        if (!readerViewMode) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                exitReaderView();
            }
        };

        globalThis.addEventListener('keydown', handleKeyDown);
        return () => {
            globalThis.removeEventListener('keydown', handleKeyDown);
        };
    }, [readerViewMode, exitReaderView]);

    useEffect(() => {
        if (!readerViewMode) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [readerViewMode]);

    useEffect(() => {
        if (!readerViewMode) return;

        globalThis.history.pushState({ __readerViewOverlay: true }, '', globalThis.location.href);
        readerViewHistoryEntryRef.current = true;

        const handlePopState = () => {
            if (suppressReaderViewPopStateRef.current) {
                suppressReaderViewPopStateRef.current = false;
                return;
            }
            if (!readerViewHistoryEntryRef.current) return;
            readerViewHistoryEntryRef.current = false;
            setReaderViewMode(false);
        };

        globalThis.addEventListener('popstate', handlePopState);
        return () => {
            globalThis.removeEventListener('popstate', handlePopState);
        };
    }, [readerViewMode]);

    return {
        readerViewMode,
        exitReaderView,
        toggleReaderView,
    } as const;
}
