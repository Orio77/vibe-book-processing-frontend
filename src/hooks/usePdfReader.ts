import { useState, useEffect, useCallback } from 'react';
import { fetchPdf, fetchChapters, fetchPageSentences } from '@/lib/api';
import { DEFAULT_PAGE } from '@/lib/constants';
import type { PDF, Chapter, Sentence } from '@/types';

export function usePdfReader(id: string | undefined) {
    const [pdfInfo, setPdfInfo] = useState<PDF | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [sentences, setSentences] = useState<Sentence[]>([]);
    const [page, setPage] = useState(DEFAULT_PAGE);
    const [metaLoading, setMetaLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(false);

    // Load metadata once
    useEffect(() => {
        if (!id) return;

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
    }, [id]);

    // Load sentences when page changes
    useEffect(() => {
        if (!id) return;

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
    }, [id, page]);

    const totalPages = pdfInfo?.totalPages ?? 1;

    const goToPage = useCallback(
        (p: number) => setPage(Math.min(Math.max(DEFAULT_PAGE, p), totalPages)),
        [totalPages],
    );
    const prevPage = useCallback(() => setPage((p) => Math.max(DEFAULT_PAGE, p - 1)), []);
    const nextPage = useCallback(() => setPage((p) => Math.min(totalPages, p + 1)), [totalPages]);

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
