import { fetchAllPdfs, fetchQueueJob } from '$lib/api/features/pdf';
import { listOfflineBookRecordsSorted } from '$lib/offline/libraryDb';
import { readPendingUploadJobIds, removePendingUploadJobId } from '$lib/pendingUploadJobs';
import { onMount } from 'svelte';

export type UnifiedBook = {
    id: number | string;
    title: string;
    pages: number;
    date: string;
    color1?: string;
    color2?: string;
    isOffline: boolean;
};

export class LibraryStore {
    books = $state<UnifiedBook[]>([]);
    isLoading = $state(true);
    pendingJobs = $state<number[]>([]);
    completedJobsMap = $state(new Map<number, string>());
    isInitialLoad = $state(true);
    
    private interval: ReturnType<typeof setInterval> | null = null;

    private getColors(str: string) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Multiply by primes to heavily distribute small differences in hash across the color wheel
        const hue1 = Math.abs((hash * 137) % 360);
        const hue2 = Math.abs((hash * 257) % 360);
        return {
            color1: `hsl(${hue1}, 100%, 72%)`,
            color2: `hsl(${hue2}, 100%, 50%)`
        };
    }

    fetchLibraryData = async (updateState: boolean = true): Promise<UnifiedBook[]> => {
        this.isLoading = true;
        try {
            const [onlinePdfsResult, offlineBooksResult] = await Promise.allSettled([
                fetchAllPdfs(),
                listOfflineBookRecordsSorted()
            ]);

            const newBooks: UnifiedBook[] = [];

            if (onlinePdfsResult.status === 'fulfilled') {
                for (const pdf of onlinePdfsResult.value) {
                    const colors = this.getColors(pdf.title);
                    newBooks.push({
                        id: `online-${pdf.id}`,
                        title: pdf.title,
                        pages: pdf.totalPages,
                        date: new Date(pdf.createdAt).toLocaleDateString(),
                        color1: colors.color1,
                        color2: colors.color2,
                        isOffline: false
                    });
                }
            }

            if (offlineBooksResult.status === 'fulfilled') {
                for (const record of offlineBooksResult.value) {
                    const colors = this.getColors(record.book.pdf.title);
                    newBooks.push({
                        id: `offline-${record.exportId}`,
                        title: record.book.pdf.title,
                        pages: record.book.pdf.totalPages,
                        date: new Date(record.updatedAt).toLocaleDateString(),
                        color1: colors.color1,
                        color2: colors.color2,
                        isOffline: true
                    });
                }
            }

            const sortedBooks = newBooks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (updateState) {
                this.books = sortedBooks;
                if (this.isInitialLoad) {
                    setTimeout(() => {
                        this.isInitialLoad = false;
                    }, 1000);
                }
            }
            return sortedBooks;
        } catch (e) {
            console.error("Failed to fetch library", e);
            return [];
        } finally {
            this.isLoading = false;
        }
    }

    setupPolling = () => {
        this.pendingJobs = readPendingUploadJobIds();
        
        this.interval = setInterval(async () => {
            if (this.pendingJobs.length === 0) return;
            
            for (const jobId of this.pendingJobs) {
                try {
                    const job = await fetchQueueJob(jobId);
                    if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
                        if (job.status === 'COMPLETED' && job.resultId) {
                            this.completedJobsMap.set(jobId, `online-${job.resultId}`);
                            const newBooks = await this.fetchLibraryData(false);
                            
                            this.books = newBooks;
                            removePendingUploadJobId(jobId);
                            this.pendingJobs = this.pendingJobs.filter(id => id !== jobId);
                        } else {
                            removePendingUploadJobId(jobId);
                            this.pendingJobs = this.pendingJobs.filter(id => id !== jobId);
                        }
                    }
                } catch (e) {
                    console.error("Failed to poll job", e);
                }
            }
        }, 3000);
    }
    
    deleteLibraryBook = async (id: string | number) => {
        const idStr = id.toString();
        try {
            if (idStr.startsWith('online-')) {
                const numId = Number(idStr.replace('online-', ''));
                const { deletePdf } = await import('$lib/api/features/pdf');
                await deletePdf(numId);
            } else if (idStr.startsWith('offline-')) {
                const exportId = idStr.replace('offline-', '');
                const { deleteOfflineBookRecord } = await import('$lib/offline/libraryDb');
                await deleteOfflineBookRecord(exportId);
            }
            await this.fetchLibraryData();
        } catch (e) {
            console.error("Failed to delete book", e);
            throw e;
        }
    }

    cleanup = () => {
        if (this.interval) clearInterval(this.interval);
    }
}

export function createLibraryStore() {
    const store = new LibraryStore();
    
    onMount(() => {
        store.fetchLibraryData();
        store.setupPolling();
        return store.cleanup;
    });
    
    return store;
}
