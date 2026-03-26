import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Plus, Clock, Trash2 } from 'lucide-react';
import { usePdfList } from '@/hooks';
import { ROUTES } from '@/lib/constants';
import { LoadingSpinner, EmptyState } from '@/components/ui';

const PDFList = () => {
    const { pdfs, loading, remove } = usePdfList();
    const location = useLocation();
    const navigate = useNavigate();

    const uploadInfo =
        (location.state as { uploadInfo?: { mode?: string; jobId?: number } } | null)
            ?.uploadInfo;
    const queuedJobId = uploadInfo?.mode === 'queued' ? uploadInfo.jobId : undefined;
    const [showQueuedInfo, setShowQueuedInfo] = useState(queuedJobId != null);
    const [queuedInfoLeaving, setQueuedInfoLeaving] = useState(false);

    useEffect(() => {
        if (queuedJobId == null) {
            setShowQueuedInfo(false);
            setQueuedInfoLeaving(false);
            return;
        }

        setShowQueuedInfo(true);
        setQueuedInfoLeaving(false);

        const dismissTimer = globalThis.setTimeout(() => {
            setQueuedInfoLeaving(true);
        }, 2000);

        const cleanupTimer = globalThis.setTimeout(() => {
            setShowQueuedInfo(false);
            navigate(location.pathname, { replace: true });
        }, 2400);

        return () => {
            globalThis.clearTimeout(dismissTimer);
            globalThis.clearTimeout(cleanupTimer);
        };
    }, [queuedJobId, navigate, location.pathname]);

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.preventDefault();
        if (!globalThis.confirm('Are you sure you want to delete this PDF?')) return;
        try {
            await remove(id);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete.');
        }
    };

    if (loading) return <LoadingSpinner className="h-64" />;

    return (
        <div className="w-full">
            {showQueuedInfo && queuedJobId != null && (
                <div className={`overflow-hidden rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm text-amber-800 transition-all duration-400 ease-out ${queuedInfoLeaving ? 'mb-0 max-h-0 py-0 opacity-0 -translate-y-1' : 'mb-6 max-h-24 py-3 opacity-100 translate-y-0'}`}>
                    Upload accepted and queued (job #{queuedJobId}). Your book will appear once background processing finishes.
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Your Library
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Manage and read your uploaded books
                    </p>
                </div>
                <Link
                    to={ROUTES.UPLOAD}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg inline-flex items-center transition-colors shadow-sm hover:shadow"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add New Book
                </Link>
            </div>

            {/* Content */}
            {pdfs.length === 0 ? (
                <EmptyState
                    icon={<BookOpen className="w-8 h-8 text-blue-500" />}
                    title="Your library is empty"
                    description="Upload your first PDF book to start reading, analyzing, and extracting insights."
                    action={
                        <Link
                            to={ROUTES.UPLOAD}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                        >
                            Upload a PDF
                        </Link>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {pdfs.map((pdf) => (
                        <PDFCard key={pdf.id} pdf={pdf} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Sub-component: PDF Card
// ---------------------------------------------------------------------------

interface PDFCardProps {
    readonly pdf: { id: number; title: string; totalPages: number; createdAt: string };
    readonly onDelete: (id: number, e: React.MouseEvent) => void;
}function PDFCard({ pdf, onDelete }: PDFCardProps) {
    return (
        <Link
            to={ROUTES.readById(pdf.id)}
            className="group flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden hover:border-blue-300"
        >
            {/* Book Cover Placeholder */}
            <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 relative flex items-center justify-center p-6 border-b border-slate-100">
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors duration-200" />
                <div className="w-full h-full bg-white shadow-sm rounded border border-slate-200 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-300 to-slate-400" />
                    <FileText className="w-10 h-10 text-slate-300 mb-3" />
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider line-clamp-3">
                        {pdf.title || `Book ${pdf.id}`}
                    </span>
                </div>
            </div>

            {/* Book Details */}
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-slate-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
                    {pdf.title || `Book ${pdf.id}`}
                </h3>
                <div className="flex items-center text-xs text-slate-500 mb-4 mt-auto pt-2">
                    <span className="flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        {pdf.totalPages == null
                            ? 'Unknown pages'
                            : `${pdf.totalPages} pages`}
                    </span>
                    {pdf.createdAt && (
                        <>
                            <span className="mx-2">•</span>
                            <span className="flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                {new Date(pdf.createdAt).toLocaleDateString()}
                            </span>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-sm font-medium text-blue-600 flex items-center">
                        Read{' '}
                        <span className="ml-1 group-hover:translate-x-1 transition-transform">
                            →
                        </span>
                    </span>
                    <button
                        onClick={(e) => onDelete(pdf.id, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete book"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </Link>
    );
}

export default PDFList;
