import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui';
import { Loader2 } from 'lucide-react';

export interface OfflineExportConfirmOptions {
    readonly downloadZip: boolean;
    readonly saveToLibrary: boolean;
    /** When set while saving, merge into this entry instead of adding a new one. */
    readonly updateLibraryExportId: string | null;
}

export interface OfflineLibraryUpdateTarget {
    readonly exportId: string;
    readonly label: string;
}

export interface ExportOfflinePackModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onConfirm: (options: OfflineExportConfirmOptions) => void | Promise<void>;
    readonly busy: boolean;
    /** Saved offline copies of this same source PDF (for merge update). */
    readonly libraryUpdateTargets?: OfflineLibraryUpdateTarget[];
}

export function ExportOfflinePackModal({
    isOpen,
    onClose,
    onConfirm,
    busy,
    libraryUpdateTargets = [],
}: ExportOfflinePackModalProps) {
    const [downloadZip, setDownloadZip] = useState(true);
    const [saveToLibrary, setSaveToLibrary] = useState(false);
    const [updateLibraryExportId, setUpdateLibraryExportId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        queueMicrotask(() => {
            setDownloadZip(true);
            setSaveToLibrary(false);
            setUpdateLibraryExportId(null);
        });
    }, [isOpen]);

    const canSubmit = downloadZip || saveToLibrary;

    const handleClose = () => {
        if (busy) return;
        onClose();
    };

    const handleSubmit = () => {
        if (!canSubmit || busy) return;
        void onConfirm({
            downloadZip,
            saveToLibrary,
            updateLibraryExportId: saveToLibrary ? updateLibraryExportId : null,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Export offline pack">
            <div className="space-y-4 whitespace-normal">
                <p className="text-sm text-slate-600">
                    Fetch the study pack once, then choose any combination: download a ZIP file and/or save or update a
                    copy in this device&apos;s offline library (IndexedDB). Updating merges new summaries and ideas from
                    the server while keeping offline chat rows that still match the text.
                </p>

                <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                    <input
                        type="checkbox"
                        className="mt-1 rounded border-slate-300"
                        checked={downloadZip}
                        disabled={busy}
                        aria-label="Download study pack as ZIP"
                        onChange={(e) => setDownloadZip(e.target.checked)}
                    />
                    <span>
                        <span className="font-medium text-slate-800">Download ZIP</span>
                        <span className="block text-sm text-slate-500">
                            Save manifest and book JSON as a file (share or backup).
                        </span>
                    </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                    <input
                        type="checkbox"
                        className="mt-1 rounded border-slate-300"
                        checked={saveToLibrary}
                        disabled={busy}
                        aria-label="Save study pack to offline library on this device"
                        onChange={(e) => setSaveToLibrary(e.target.checked)}
                    />
                    <span>
                        <span className="font-medium text-slate-800">Save to offline library</span>
                        <span className="block text-sm text-slate-500">
                            Store on this device, or update an existing saved copy of this book after new processing.
                        </span>
                    </span>
                </label>

                {saveToLibrary && libraryUpdateTargets.length > 0 && (
                    <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                        <label htmlFor="offline-export-merge-target" className="block text-sm font-medium text-slate-800">
                            Library entry
                        </label>
                        <select
                            id="offline-export-merge-target"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white"
                            disabled={busy}
                            value={updateLibraryExportId ?? ''}
                            onChange={(e) => setUpdateLibraryExportId(e.target.value || null)}
                        >
                            <option value="">Add new library entry</option>
                            {libraryUpdateTargets.map((t) => (
                                <option key={t.exportId} value={t.exportId}>
                                    Update: {t.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500">
                            Choose &quot;Update&quot; to refresh processed content without losing matching offline chats.
                        </p>
                    </div>
                )}

                {!canSubmit && (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Select at least one option.
                    </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={busy}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit || busy}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                        {busy ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Working…
                            </>
                        ) : (
                            'Run export'
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
