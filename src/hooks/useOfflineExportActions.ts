import { useCallback, useEffect, useState } from 'react';
import {
    buildOfflineBundlePayload,
    exportOfflineRecordToZipBlob,
    getOfflineBookRecord,
    listOfflineBookRecordsForSourcePdf,
    mergeOfflineRecordWithNewPayload,
    MergeOfflineBookError,
    offlineBundlePayloadToZipBlob,
    putOfflineBookRecord,
    saveOfflineBundleToLibrary,
} from '@/lib/offline';
import { getApiErrorMessage } from '@/lib/api';
import type { ToastData } from '@/types';
import type { OfflineBookRecord } from '@/types/offlineLibrary';
import type { OfflineExportConfirmOptions, OfflineLibraryUpdateTarget } from '@/components/features/ExportOfflinePackModal';
import type { ReaderSession } from '@/context/ReaderSessionContext';

type OfflineExportOutcome = {
    readonly downloadDone: boolean;
    readonly saveDone: boolean;
    readonly updatedExisting: boolean;
    readonly saveRequested: boolean;
};

function toSafeZipTitle(rawTitle: string | null | undefined): string {
    return (rawTitle ?? 'book').replaceAll(/[^\w\-.,()]+/g, '_').slice(0, 80);
}

function getOfflineSaveErrorMessage(error: unknown): string {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        return 'Storage is full. Could not save to offline library.';
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'Could not save to offline library.';
}

function getOfflineExportOutcomeToast(outcome: OfflineExportOutcome): { message: string; type: ToastData['type'] } | null {
    const { downloadDone, saveDone, updatedExisting, saveRequested } = outcome;

    if (downloadDone && saveDone && updatedExisting) {
        return { message: 'Study pack downloaded and offline library updated.', type: 'success' };
    }
    if (downloadDone && saveDone) {
        return { message: 'Study pack downloaded and saved to your offline library.', type: 'success' };
    }
    if (downloadDone && saveRequested && !saveDone) {
        return { message: 'Pack downloaded, but saving to the offline library failed.', type: 'error' };
    }
    if (downloadDone) {
        return { message: 'Offline pack downloaded.', type: 'success' };
    }
    if (saveDone && updatedExisting) {
        return { message: 'Offline library updated with the latest pack.', type: 'success' };
    }
    if (saveDone) {
        return { message: 'Saved to your offline library.', type: 'success' };
    }
    return null;
}

function performOfflinePackDownload(
    shouldDownload: boolean,
    payload: Awaited<ReturnType<typeof buildOfflineBundlePayload>>,
    safeTitle: string,
): boolean {
    if (!shouldDownload) return false;

    const blob = offlineBundlePayloadToZipBlob(payload);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeTitle}-offline-pack.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
    return true;
}

async function performOfflineLibrarySave(
    options: OfflineExportConfirmOptions,
    payload: Awaited<ReturnType<typeof buildOfflineBundlePayload>>,
    page: number,
    showToast: (message: string, type: ToastData['type']) => void,
): Promise<boolean> {
    if (!options.saveToLibrary) return false;

    try {
        if (options.updateLibraryExportId) {
            const existing = await getOfflineBookRecord(options.updateLibraryExportId);
            if (existing) {
                const merged = mergeOfflineRecordWithNewPayload(existing, payload);
                await putOfflineBookRecord(merged);
                return true;
            }
            showToast('That offline library entry is gone. Pick another or add a new entry.', 'error');
            return false;
        }

        await saveOfflineBundleToLibrary(payload.manifest, payload.book, page);
        return true;
    } catch (saveError) {
        if (saveError instanceof MergeOfflineBookError) {
            showToast(saveError.message, 'error');
        } else {
            showToast(getOfflineSaveErrorMessage(saveError), 'error');
        }
        return false;
    }
}

interface UseOfflineExportActionsOptions {
    readonly session: ReaderSession;
    readonly pdfInfoId: number | undefined;
    readonly pdfTitle: string | null | undefined;
    readonly page: number;
    readonly showToast: (message: string, type: ToastData['type']) => void;
}

export function useOfflineExportActions({
    session,
    pdfInfoId,
    pdfTitle,
    page,
    showToast,
}: UseOfflineExportActionsOptions) {
    const [exportingPack, setExportingPack] = useState(false);
    const [exportPackModalOpen, setExportPackModalOpen] = useState(false);
    const [offlineLibraryUpdateTargets, setOfflineLibraryUpdateTargets] = useState<OfflineLibraryUpdateTarget[]>([]);

    useEffect(() => {
        if (session.mode !== 'online' || pdfInfoId == null) {
            setOfflineLibraryUpdateTargets([]);
            return;
        }
        let cancelled = false;
        listOfflineBookRecordsForSourcePdf(pdfInfoId).then((rows) => {
            if (cancelled) return;
            setOfflineLibraryUpdateTargets(
                rows.map((record) => ({
                    exportId: record.exportId,
                    label: (record.manifest.sourcePdfTitle ?? record.book.pdf.title ?? 'Offline copy').trim() || 'Offline copy',
                })),
            );
        });
        return () => {
            cancelled = true;
        };
    }, [session.mode, pdfInfoId]);

    const handleConfirmOfflineExport = useCallback(async (options: OfflineExportConfirmOptions) => {
        if (session.mode !== 'online') return;
        if (!options.downloadZip && !options.saveToLibrary) return;

        setExportingPack(true);
        try {
            const payload = await buildOfflineBundlePayload(session.pdfId);
            const safeTitle = toSafeZipTitle(pdfTitle);
            const updatedExisting = Boolean(options.saveToLibrary && options.updateLibraryExportId);
            const downloadDone = performOfflinePackDownload(options.downloadZip, payload, safeTitle);
            const saveDone = await performOfflineLibrarySave(options, payload, page, showToast);

            const outcomeToast = getOfflineExportOutcomeToast({
                downloadDone,
                saveDone,
                updatedExisting,
                saveRequested: options.saveToLibrary,
            });
            if (outcomeToast) {
                showToast(outcomeToast.message, outcomeToast.type);
            }

            setExportPackModalOpen(false);
        } catch (error) {
            console.error(error);
            showToast(getApiErrorMessage(error, 'Export failed.'), 'error');
        } finally {
            setExportingPack(false);
        }
    }, [session, pdfTitle, page, showToast]);

    const handleDownloadOfflineLibraryZip = useCallback(async () => {
        if (session.mode !== 'offline') return;
        await session.flushOfflineSave();

        const safeTitle = toSafeZipTitle(pdfTitle);
        const record: OfflineBookRecord = {
            exportId: session.exportId,
            manifest: session.bundle.manifest,
            book: session.bundle.book,
            lastPage: page,
            updatedAt: new Date().toISOString(),
        };
        const blob = exportOfflineRecordToZipBlob(record);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${safeTitle}-offline-pack.zip`;
        anchor.click();
        URL.revokeObjectURL(url);
        showToast('Pack downloaded.', 'success');
    }, [session, pdfTitle, page, showToast]);

    return {
        exportingPack,
        exportPackModalOpen,
        setExportPackModalOpen,
        offlineLibraryUpdateTargets,
        handleConfirmOfflineExport,
        handleDownloadOfflineLibraryZip,
    } as const;
}
