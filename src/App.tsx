import { lazy, Suspense, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { NavBar, ErrorBoundary, LoadingSpinner, NotFound, Toast } from '@/components/ui';
import { useJobCompletionSubscription, useToast } from '@/hooks';
import { ROUTES } from '@/lib/constants';
import type { ToastData } from '@/types';
import { fetchQueueJob } from '@/lib/api';

const PENDING_UPLOAD_JOB_IDS_KEY = 'pendingUploadJobIds';

function readPendingUploadJobIds(): number[] {
    try {
        const raw = globalThis.localStorage.getItem(PENDING_UPLOAD_JOB_IDS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map(Number)
            .filter((item) => Number.isFinite(item));
    } catch {
        return [];
    }
}

function writePendingUploadJobIds(jobIds: number[]): void {
    globalThis.localStorage.setItem(PENDING_UPLOAD_JOB_IDS_KEY, JSON.stringify(jobIds));
}

// Lazy-loaded route components for code splitting
const PDFList = lazy(() => import('@/components/features/PDFList'));
const UploadPDF = lazy(() => import('@/components/features/UploadPDF'));
const PDFReader = lazy(() => import('@/components/features/PDFReader'));
const OfflineLibraryPage = lazy(() => import('@/components/features/OfflineReaderPage'));
const OfflineExportedReaderPage = lazy(() =>
    import('@/components/features/OfflineReaderPage').then((m) => ({ default: m.OfflineExportedReaderPage })),
);

function App() {
    const processingJobsRef = useRef<Set<number>>(new Set());
    const { toast, showToast, dismissToast } = useToast();

    const handleJobCompleted = useCallback(async (jobId: number) => {
        const pendingJobIds = readPendingUploadJobIds();
        if (!pendingJobIds.includes(jobId)) {
            return;
        }

        if (processingJobsRef.current.has(jobId)) {
            return;
        }

        processingJobsRef.current.add(jobId);

        try {
            const job = await fetchQueueJob(jobId);

            if (job.status === 'COMPLETED') {
                showToast('Upload finished. Your book is now in the library.', 'success');
                globalThis.dispatchEvent(new CustomEvent('pdf-library-refresh'));
            } else {
                showToast(job.errorText?.trim() || 'Upload failed while processing in queue.', 'error');
            }
        } catch (error) {
            console.error('Failed to process upload completion event:', error);
            showToast('Received completion event but failed to resolve upload status.', 'error');
        } finally {
            const current = readPendingUploadJobIds();
            writePendingUploadJobIds(current.filter((id) => id !== jobId));
            processingJobsRef.current.delete(jobId);
        }
    }, [showToast]);

    useJobCompletionSubscription(handleJobCompleted);

    return (
        <Router>
            <ErrorBoundary>
                <AppShell toast={toast} dismissToast={dismissToast} />
            </ErrorBoundary>
        </Router>
    );
}

function AppShell({
    toast,
    dismissToast,
}: {
    readonly toast: ToastData | null;
    readonly dismissToast: () => void;
}) {
    const location = useLocation();
    const isReaderRoute = location.pathname.startsWith('/read/');

    return (
        <div className="flex min-h-[100dvh] min-h-screen flex-col bg-slate-50 font-sans text-slate-800 selection:bg-blue-200 selection:text-blue-900">
            <NavBar hideMobileTabs={isReaderRoute} />

            <main
                className={
                    isReaderRoute
                        ? 'flex min-h-0 w-full flex-1 flex-col overflow-hidden'
                        : 'mx-auto w-full max-w-7xl flex-1 min-h-0 px-4 pb-[calc(2rem+3.5rem+env(safe-area-inset-bottom,0px))] pt-8 sm:px-6 sm:pb-8 sm:pt-8 lg:px-8'
                }
            >
                <Suspense fallback={<LoadingSpinner className="h-64" />}>
                    <Routes>
                        <Route path={ROUTES.HOME} element={<PDFList />} />
                        <Route path={ROUTES.UPLOAD} element={<UploadPDF />} />
                        <Route path={ROUTES.READ_OFFLINE_EXPORT} element={<OfflineExportedReaderPage />} />
                        <Route path={ROUTES.READ_OFFLINE} element={<OfflineLibraryPage />} />
                        <Route path={ROUTES.READ} element={<PDFReader />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </main>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={dismissToast}
                />
            )}
        </div>
    );
}

export default App;
