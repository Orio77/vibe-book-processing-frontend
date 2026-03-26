import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchAllPdfs, deletePdf } from '@/lib/api';
import type { PDF } from '@/types';

export function usePdfList() {
    const [pdfs, setPdfs] = useState<PDF[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const location = useLocation();

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAllPdfs();
            setPdfs(data);
        } catch (err) {
            console.error('Error fetching PDFs:', err);
            setError('Failed to load your library. Please try again.');
            setPdfs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load, location]);

    useEffect(() => {
        const handleRefresh = () => {
            void load();
        };

        globalThis.addEventListener('pdf-library-refresh', handleRefresh);
        return () => {
            globalThis.removeEventListener('pdf-library-refresh', handleRefresh);
        };
    }, [load]);

    const remove = useCallback(async (id: number) => {
        try {
            await deletePdf(id);
            setPdfs((prev) => prev.filter((pdf) => pdf.id !== id));
        } catch (err: unknown) {
            const error = err as { response?: { status?: number } };
            if (error.response?.status === 404) {
                // Already deleted on the server — remove locally
                setPdfs((prev) => prev.filter((pdf) => pdf.id !== id));
                throw new Error('Book not found — it may have already been deleted.');
            }
            throw new Error('Failed to delete the book. Please try again.');
        }
    }, []);

    return { pdfs, loading, error, remove, reload: load } as const;
}
