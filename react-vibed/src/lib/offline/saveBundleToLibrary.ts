import { putOfflineBookRecord } from './libraryDb';
import type { OfflineBookPayload, OfflineBundleManifest } from '@/types/offlineBundle';

/** Writes a freshly built pack into IndexedDB (same shape as ZIP import). */
export async function saveOfflineBundleToLibrary(
    manifest: OfflineBundleManifest,
    book: OfflineBookPayload,
    lastPage: number,
): Promise<void> {
    const total = book.pdf.totalPages;
    const clamped = Math.min(Math.max(1, lastPage), total);
    await putOfflineBookRecord({
        exportId: manifest.exportId,
        manifest,
        book: structuredClone(book),
        lastPage: clamped,
        updatedAt: new Date().toISOString(),
    });
}
