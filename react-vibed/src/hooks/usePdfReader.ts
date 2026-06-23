import { useState, useEffect, useCallback, useRef } from 'react';
import { useReaderSession } from '@/context/ReaderSessionContext';
import { fetchPdf, fetchChapters, fetchPageSentences } from '@/lib/api';
import { DEFAULT_PAGE } from '@/lib/constants';
import type { PDF, Chapter, Sentence } from '@/types';

export function usePdfReader() {
    const session = useReaderSession();
    const [pdfInfo, setPdfInfo] = useState<PDF | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [sentences, setSentences] = useState<Sentence[]>([]);
    const [page, setPage] = useState(DEFAULT_PAGE);
    const [metaLoading, setMetaLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(false);
    const hydratedOfflineExportRef = useRef<string | null>(null);

    useEffect(() => {
        if (session.mode !== 'offline') {
            hydratedOfflineExportRef.current = null;
            return;
        }
        if (hydratedOfflineExportRef.current === session.exportId) return;
        hydratedOfflineExportRef.current = session.exportId;
        const total = session.bundle.book.pdf.totalPages;
        const clamped = Math.min(Math.max(1, session.initialLastPage), total);
        setPage(clamped);
    }, [session]);

    useEffect(() => {
        if (session.mode === 'offline') {
            setPdfInfo(session.bundle.book.pdf);
            setChapters(session.bundle.book.chapters);
            setMetaLoading(false);
            return;
        }

        const id = session.pdfId;
        let cancelled = false;
        const load = async () => {
            setMetaLoading(true);
            try {
                const [pdf, chaps] = await Promise.all([
                    fetchPdf(id),
                    fetchChapters(id),
                ]);
                if (!cancelled) {
                    setPdfInfo(pdf);
                    setChapters(chaps);
                }
            } catch (err) {
                console.error('Error fetching PDF metadata:', err);
            } finally {
                if (!cancelled) setMetaLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [session]);

    useEffect(() => {
        if (session.mode === 'offline') {
            setSentences(session.bundle.sentencesByPage.get(page) ?? []);
            setPageLoading(false);
            return;
        }

        const id = session.pdfId;
        let cancelled = false;
        const load = async () => {
            setPageLoading(true);
            try {
                const data = await fetchPageSentences(id, page);
                if (!cancelled) setSentences(data);
            } catch (err) {
                console.error('Error fetching page content:', err);
                if (!cancelled) setSentences([]);
            } finally {
                if (!cancelled) setPageLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [session, page]);

    const totalPages = pdfInfo?.totalPages ?? 1;

    const goToPage = useCallback(
        (p: number) => {
            const next = Math.min(Math.max(DEFAULT_PAGE, p), totalPages);
            setPage(next);
            if (session.mode === 'offline') {
                session.setLastPage(next);
            }
        },
        [totalPages, session],
    );
    const prevPage = useCallback(() => {
        setPage((p) => {
            const next = Math.max(DEFAULT_PAGE, p - 1);
            if (session.mode === 'offline') {
                session.setLastPage(next);
            }
            return next;
        });
    }, [session]);
    const nextPage = useCallback(() => {
        setPage((p) => {
            const next = Math.min(totalPages, p + 1);
            if (session.mode === 'offline') {
                session.setLastPage(next);
            }
            return next;
        });
    }, [totalPages, session]);

    const activeChapter = chapters.find(
        (c) => page >= c.startPage && page <= c.endPage,
    );

    return {
        pdfInfo,
        chapters,
        sentences,
        page,
        totalPages,
        metaLoading,
        pageLoading,
        activeChapter,
        goToPage,
        prevPage,
        nextPage,
        setPage: goToPage,
    } as const;
}
