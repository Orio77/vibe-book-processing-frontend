import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { ReaderSessionContext, type ReaderSession } from '@/context/ReaderSessionContext';
import { buildParsedBundleFromBook } from '@/lib/offline/bundleFromBook';
import { putOfflineBookRecord } from '@/lib/offline/libraryDb';
import type { OfflineBookPayload } from '@/types/offlineBundle';
import type { MutableOfflineBookPayload, OfflineBookRecord } from '@/types/offlineLibrary';

export function OfflineReaderSessionProvider({
    initialRecord,
    children,
    onPersistError,
}: {
    readonly initialRecord: OfflineBookRecord;
    readonly children: ReactNode;
    readonly onPersistError?: (message: string) => void;
}) {
    const exportId = initialRecord.exportId;
    const snapshotLastPageOnOpen = initialRecord.lastPage;

    const [bundle, setBundle] = useState(() =>
        buildParsedBundleFromBook(
            initialRecord.manifest,
            structuredClone(initialRecord.book) as OfflineBookPayload,
        ),
    );

    const [lastPage, setLastPageState] = useState(initialRecord.lastPage);

    const bundleRef = useRef(bundle);
    const lastPageRef = useRef(lastPage);
    useLayoutEffect(() => {
        bundleRef.current = bundle;
        lastPageRef.current = lastPage;
    });

    const patchBook = useCallback((recipe: (draft: MutableOfflineBookPayload) => void) => {
        setBundle((prev) => {
            const book = structuredClone(prev.book) as MutableOfflineBookPayload;
            recipe(book);
            return buildParsedBundleFromBook(prev.manifest, book as OfflineBookPayload);
        });
    }, []);

    const setLastPage = useCallback((page: number) => {
        setLastPageState(page);
    }, []);

    const persistNow = useCallback(async () => {
        const b = bundleRef.current;
        const lp = lastPageRef.current;
        const total = b.book.pdf.totalPages;
        const clampedPage = Math.min(Math.max(1, lp), total);
        try {
            await putOfflineBookRecord({
                exportId,
                manifest: b.manifest,
                book: structuredClone(b.book) as OfflineBookPayload,
                lastPage: clampedPage,
                updatedAt: new Date().toISOString(),
            });
        } catch (e) {
            const name = e instanceof DOMException ? e.name : e instanceof Error ? e.name : '';
            const msg =
                name === 'QuotaExceededError'
                    ? 'Storage is full. Free space or remove an offline book.'
                    : e instanceof Error
                        ? e.message
                        : 'Could not save offline library.';
            onPersistError?.(msg);
        }
    }, [exportId, onPersistError]);

    useEffect(() => {
        const t = setTimeout(() => {
            void persistNow();
        }, 400);
        return () => clearTimeout(t);
    }, [bundle, lastPage, persistNow]);

    useEffect(() => {
        const flush = () => {
            if (document.visibilityState === 'hidden') {
                void persistNow();
            }
        };
        document.addEventListener('visibilitychange', flush);
        const onHide = () => void persistNow();
        window.addEventListener('pagehide', onHide);
        return () => {
            document.removeEventListener('visibilitychange', flush);
            window.removeEventListener('pagehide', onHide);
        };
    }, [persistNow]);

    const sessionValue = useMemo<ReaderSession>(
        () => ({
            mode: 'offline',
            exportId,
            bundle,
            initialLastPage: snapshotLastPageOnOpen,
            patchBook,
            setLastPage,
            flushOfflineSave: persistNow,
        }),
        [exportId, bundle, snapshotLastPageOnOpen, patchBook, setLastPage, persistNow],
    );

    return (
        <ReaderSessionContext.Provider value={sessionValue}>
            {children}
        </ReaderSessionContext.Provider>
    );
}
