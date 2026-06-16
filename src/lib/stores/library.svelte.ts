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
    
    private interval: ReturnType<typeof setInterval> | null = null;

    private getColors(str: string) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue1 = Math.abs(hash % 360);
        const hue2 = Math.abs((hash * 2) % 360);
        return {
            color1: `hsl(${hue1}, 100%, 72%)`,
            color2: `hsl(${hue2}, 100%, 50%)`
        };
    }

    fetchLibraryData = async () => {
        this.isLoading = true;
        try {
            const [onlinePdfsResult, offlineBooksResult] = await Promise.allSettled([
                fetchAllPdfs(),
                listOfflineBookRecordsSorted()
            ]);

            const newBooks: UnifiedBook[] = [];

            if (onlinePdfsResult.status === 'fulfilled') {
                for (const pdf of onlinePdfsResult.value) {
                    const colors = this.getColors(`online-${pdf.id}`);
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
                    const colors = this.getColors(`offline-${record.exportId}`);
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

            this.books = newBooks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch (e) {
            console.error("Failed to fetch library", e);
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
                        removePendingUploadJobId(jobId);
                        this.pendingJobs = this.pendingJobs.filter(id => id !== jobId);
                        
                        if (job.status === 'COMPLETED') {
                            this.fetchLibraryData();
                        }
                    }
                } catch (e) {
                    console.error("Failed to poll job", e);
                }
            }
        }, 3000);
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
