import { lazy, Suspense, useCallback, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { NavBar, ErrorBoundary, LoadingSpinner, NotFound, Toast } from '@/components/ui';
import { useJobCompletionSubscription, useToast } from '@/hooks';
import { ROUTES } from '@/lib/constants';
import type { ToastData } from '@/types';
import { fetchQueueJob, isAuthenticated } from '@/lib/api';
import { readPendingUploadJobIds, removePendingUploadJobId } from '@/lib/pendingUploadJobs';

const RECONCILE_INTERVAL_MS = 5000;

// Lazy-loaded route components for code splitting
const PDFList = lazy(() => import('@/components/features/PDFList'));
const UploadPDF = lazy(() => import('@/components/features/UploadPDF'));
const PDFReader = lazy(() => import('@/components/features/PDFReader'));
const AuthPage = lazy(() => import('@/components/features/AuthPage'));
const OfflineLibraryPage = lazy(() => import('@/components/features/OfflineReaderPage'));
const OfflineExportedReaderPage = lazy(() =>
    import('@/components/features/OfflineReaderPage').then((m) => ({ default: m.OfflineExportedReaderPage })),
);

function RequireAuth({ children }: { readonly children: ReactElement }) {
    const location = useLocation();

    if (!isAuthenticated()) {
        const from = `${location.pathname}${location.search}${location.hash}`;
        return <Navigate to={ROUTES.AUTH_LOGIN} replace state={{ from }} />;
    }

    return children;
}

function App() {
    const processingJobsRef = useRef<Set<number>>(new Set());
    const { toast, showToast, dismissToast } = useToast();
    const authenticated = isAuthenticated();

    const resolvePendingUploadJob = useCallback(async (jobId: number, source: 'event' | 'reconcile') => {
        if (!readPendingUploadJobIds().includes(jobId)) {
            return;
        }

        if (processingJobsRef.current.has(jobId)) {
            return;
        }

        processingJobsRef.current.add(jobId);
        let shouldRemove = false;

        try {
            const job = await fetchQueueJob(jobId);

            if (job.status === 'COMPLETED') {
                shouldRemove = true;
                showToast('Upload finished. Your book is now in the library.', 'success');
                globalThis.dispatchEvent(new CustomEvent('pdf-library-refresh'));
                return;
            }

            if (job.status === 'FAILED' || job.status === 'CANCELLED') {
                shouldRemove = true;
                showToast(job.errorText?.trim() || 'Upload failed while processing in queue.', 'error');
            } else {
                // Non-terminal status: keep job ID so reconciliation can retry later.
                return;
            }
        } catch (error) {
            const status = (error as { response?: { status?: number } })?.response?.status;
            if (status === 404) {
                // Stale local entry (e.g., old environment/session) -> stop retrying forever.
                removePendingUploadJobId(jobId);
                return;
            }

            if (source === 'event') {
                console.error('Failed to process upload completion event:', error);
                showToast('Received completion event but failed to resolve upload status.', 'error');
            } else {
                console.warn('Failed to reconcile pending upload job:', jobId, error);
            }
        } finally {
            if (shouldRemove) {
                removePendingUploadJobId(jobId);
            }
            processingJobsRef.current.delete(jobId);
        }
    }, [showToast]);

    const handleJobCompleted = useCallback(async (jobId: number) => {
        await resolvePendingUploadJob(jobId, 'event');
    }, [resolvePendingUploadJob]);

    useEffect(() => {
        if (!authenticated) {
            return;
        }

        let cancelled = false;
        let timeoutId: number | undefined;

        const reconcile = async () => {
            if (cancelled) return;

            const pendingJobIds = readPendingUploadJobIds();
            await Promise.all(
                pendingJobIds.map((jobId) => resolvePendingUploadJob(jobId, 'reconcile')),
            );

            if (!cancelled) {
                timeoutId = globalThis.setTimeout(reconcile, RECONCILE_INTERVAL_MS);
            }
        };

        void reconcile();

        return () => {
            cancelled = true;
            if (timeoutId !== undefined) {
                globalThis.clearTimeout(timeoutId);
            }
        };
    }, [authenticated, resolvePendingUploadJob]);

    useJobCompletionSubscription(handleJobCompleted, authenticated);

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
    const isAuthRoute = location.pathname.startsWith('/auth/');

    return (
        <div className="flex min-h-[100dvh] min-h-screen flex-col bg-slate-50 font-sans text-slate-800 selection:bg-blue-200 selection:text-blue-900">
            {!isReaderRoute && !isAuthRoute && <NavBar />}

            <main
                className={
                    isReaderRoute
                        ? 'flex min-h-0 w-full flex-1 flex-col overflow-hidden'
                        : 'mx-auto w-full max-w-7xl flex-1 min-h-0 px-4 pb-[calc(2rem+3.5rem+env(safe-area-inset-bottom,0px))] pt-8 sm:px-6 sm:pb-8 sm:pt-8 lg:px-8'
                }
            >
                <Suspense fallback={<LoadingSpinner className="h-64" />}>
                    <Routes>
                        <Route path={ROUTES.AUTH_LOGIN} element={<AuthPage mode="login" />} />
                        <Route path={ROUTES.AUTH_REGISTER} element={<AuthPage mode="register" />} />
                        <Route path={ROUTES.HOME} element={<RequireAuth><PDFList /></RequireAuth>} />
                        <Route path={ROUTES.UPLOAD} element={<RequireAuth><UploadPDF /></RequireAuth>} />
                        <Route path={ROUTES.READ_OFFLINE_EXPORT} element={<RequireAuth><OfflineExportedReaderPage /></RequireAuth>} />
                        <Route path={ROUTES.READ_OFFLINE} element={<RequireAuth><OfflineLibraryPage /></RequireAuth>} />
                        <Route path={ROUTES.READ} element={<RequireAuth><PDFReader /></RequireAuth>} />
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
