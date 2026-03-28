import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Trash2, Upload, ArrowRight } from 'lucide-react';
import { OfflineReaderSessionProvider } from '@/context/OfflineReaderSessionProvider';
import {
    getOfflineBookRecord,
    listOfflineBookRecordsSorted,
    parseOfflineBundleZip,
    putOfflineBookRecord,
    deleteOfflineBookRecord,
} from '@/lib/offline';
import { ROUTES } from '@/lib/constants';
import { PDFReaderShell } from '@/components/features/PDFReader';
import { LoadingSpinner, Toast } from '@/components/ui';
import { useToast } from '@/hooks';
import type { OfflineBookPayload } from '@/types/offlineBundle';
import type { OfflineBookRecord } from '@/types/offlineLibrary';

async function importZipToLibrary(arrayBuffer: ArrayBuffer): Promise<string> {
    const parsed = parseOfflineBundleZip(arrayBuffer);
    const existing = await getOfflineBookRecord(parsed.manifest.exportId);
    const total = parsed.book.pdf.totalPages;
    const lastPage = existing ? Math.min(Math.max(1, existing.lastPage), total) : 1;
    const record: OfflineBookRecord = {
        exportId: parsed.manifest.exportId,
        manifest: parsed.manifest,
        book: structuredClone(parsed.book) as OfflineBookPayload,
        lastPage,
        updatedAt: new Date().toISOString(),
    };
    await putOfflineBookRecord(record);
    return record.exportId;
}

function formatSavedAt(iso: string): string {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

function OfflineExportedReaderInner({
    exportId,
    onPersistError,
}: {
    readonly exportId: string;
    readonly onPersistError: (message: string) => void;
}) {
    const [record, setRecord] = useState<OfflineBookRecord | null | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;
        getOfflineBookRecord(exportId).then((r) => {
            if (!cancelled) setRecord(r ?? null);
        });
        return () => {
            cancelled = true;
        };
    }, [exportId]);

    if (record === undefined) {
        return <LoadingSpinner className="h-64" />;
    }

    if (record === null) {
        return (
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
                    <p className="text-slate-700">This offline book is not in your library.</p>
                    <Link
                        to={ROUTES.READ_OFFLINE}
                        className="inline-flex text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Back to offline library
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <OfflineReaderSessionProvider initialRecord={record} onPersistError={onPersistError}>
            <PDFReaderShell />
        </OfflineReaderSessionProvider>
    );
}

export function OfflineExportedReaderPage() {
    const { exportId: rawId } = useParams<{ exportId: string }>();
    const exportId = rawId ? decodeURIComponent(rawId) : '';
    const { toast, showToast, dismissToast } = useToast();

    if (!exportId) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <p className="text-slate-600">Missing book id.</p>
            </div>
        );
    }

    return (
        <>
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={dismissToast} />
            )}
            <OfflineExportedReaderInner
                key={exportId}
                exportId={exportId}
                onPersistError={(msg) => showToast(msg, 'error')}
            />
        </>
    );
}

export default function OfflineLibraryPage() {
    const navigate = useNavigate();
    const [records, setRecords] = useState<OfflineBookRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const { toast, showToast, dismissToast } = useToast();

    const refresh = useCallback(async () => {
        try {
            const list = await listOfflineBookRecordsSorted();
            setRecords(list);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'Could not load offline library.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const onPickFile = useCallback(
        async (file: File | null) => {
            setError(null);
            if (!file) return;
            setBusy(true);
            try {
                const buf = await file.arrayBuffer();
                const id = await importZipToLibrary(buf);
                await refresh();
                navigate(ROUTES.readOfflineByExportId(id));
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not import pack.');
            } finally {
                setBusy(false);
            }
        },
        [navigate, refresh],
    );

    const onRemove = useCallback(
        async (exportId: string) => {
            try {
                await deleteOfflineBookRecord(exportId);
                await refresh();
            } catch (e) {
                showToast(e instanceof Error ? e.message : 'Could not remove book.', 'error');
            }
        },
        [refresh, showToast],
    );

    const onOpen = useCallback(
        (exportId: string) => {
            navigate(ROUTES.readOfflineByExportId(exportId));
        },
        [navigate],
    );

    return (
        <div className="flex-1 min-h-0 overflow-y-auto">
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={dismissToast} />
            )}
            <div className="max-w-2xl mx-auto py-12 px-4">
                <div className="flex items-start justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Offline library</h1>
                        <p className="text-sm text-slate-600 mt-1">
                            Books stay on this device (IndexedDB). Reading position, chat, summaries, and idea notes are
                            saved automatically.
                        </p>
                    </div>
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium cursor-pointer hover:bg-slate-800 transition-colors shrink-0">
                        <Upload size={18} />
                        {busy ? 'Importing…' : 'Import ZIP'}
                        <input
                            type="file"
                            accept=".zip,application/zip"
                            className="sr-only"
                            disabled={busy}
                            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                        />
                    </label>
                </div>

                {error && (
                    <p className="mb-4 text-sm text-red-600" role="alert">
                        {error}
                    </p>
                )}

                {loading ? (
                    <LoadingSpinner className="h-48" />
                ) : records.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
                        <div className="inline-flex p-3 rounded-xl bg-blue-50 text-blue-600 mb-4">
                            <BookOpen size={28} />
                        </div>
                        <p className="text-slate-600 text-sm">
                            No books yet. Import a study pack ZIP exported from the online reader.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {records.map((rec) => {
                            const title =
                                rec.manifest.sourcePdfTitle?.trim() || rec.book.pdf.title || 'Untitled';
                            return (
                                <li
                                    key={rec.exportId}
                                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-900 truncate">{title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Page {rec.lastPage} / {rec.book.pdf.totalPages} · Saved{' '}
                                            {formatSavedAt(rec.updatedAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => onOpen(rec.exportId)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                                        >
                                            Open
                                            <ArrowRight size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onRemove(rec.exportId)}
                                            className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                            aria-label={`Remove ${title}`}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <p className="mt-10 text-sm text-slate-500">
                    <Link to={ROUTES.HOME} className="text-blue-600 hover:text-blue-700 font-medium">
                        Back to online library
                    </Link>
                </p>
            </div>
        </div>
    );
}
