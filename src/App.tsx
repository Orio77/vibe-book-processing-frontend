import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NavBar, ErrorBoundary, LoadingSpinner, NotFound } from '@/components/ui';
import { ROUTES } from '@/lib/constants';

// Lazy-loaded route components for code splitting
const PDFList = lazy(() => import('@/components/features/PDFList'));
const UploadPDF = lazy(() => import('@/components/features/UploadPDF'));
const PDFReader = lazy(() => import('@/components/features/PDFReader'));

function App() {
    return (
        <Router>
            <ErrorBoundary>
                <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-200 selection:text-blue-900">
                    <NavBar />

                    <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                        <Suspense fallback={<LoadingSpinner className="h-64" />}>
                            <Routes>
                                <Route path={ROUTES.HOME} element={<PDFList />} />
                                <Route path={ROUTES.UPLOAD} element={<UploadPDF />} />
                                <Route path={ROUTES.READ} element={<PDFReader />} />
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </main>
                </div>
            </ErrorBoundary>
        </Router>
    );
}

export default App;
