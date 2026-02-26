import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePdfReader } from '@/hooks';
import { LoadingSpinner } from '@/components/ui';
import { ReaderSidebar, ReaderToolbar, PageSkeleton, BlankPage } from './reader';

const PDFReader = () => {
    const { id } = useParams<{ id: string }>();
    const {
        pdfInfo,
        chapters,
        sentences,
        page,
        totalPages,
        metaLoading,
        pageLoading,
        activeChapter,
        goToPage,
        prevPage,
        nextPage,
    } = usePdfReader(id);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (metaLoading) {
        return <LoadingSpinner className="h-[calc(100vh-64px)]" size="lg" />;
    }

    const progressPercentage = (page / totalPages) * 100;

    const renderContent = () => {
        if (pageLoading) return <PageSkeleton page={page} />;
        if (sentences.length === 0) return <BlankPage page={page} />;

        return (
            <div className="space-y-6 text-slate-800 leading-relaxed font-serif">
                {activeChapter?.startPage === page && (
                    <div className="mb-10 pb-6 border-b border-slate-100">
                        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
                            {activeChapter.title}
                        </h1>
                    </div>
                )}
                <div className="text-lg">
                    {sentences.map((s) => (
                        <span
                            key={s.id}
                            className="inline hover:bg-blue-50 transition-colors duration-200 rounded px-0.5 cursor-text"
                        >
                            {s.content}{' '}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200 z-30">
                <div
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <button
                    type="button"
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 md:hidden transition-opacity cursor-default"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                />
            )}

            {/* Sidebar */}
            <ReaderSidebar
                pdfInfo={pdfInfo}
                chapters={chapters}
                activeChapter={activeChapter}
                sidebarOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onJumpToChapter={(ch) => {
                    goToPage(ch.startPage);
                    setSidebarOpen(false);
                }}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                <ReaderToolbar
                    page={page}
                    totalPages={totalPages}
                    activeChapter={activeChapter}
                    onToggleSidebar={() => setSidebarOpen((o) => !o)}
                    onGoToPage={goToPage}
                    onPrev={prevPage}
                    onNext={nextPage}
                />

                {/* Content Viewer */}
                <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-8 lg:py-12">
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl min-h-[600px] p-8 sm:p-12 lg:p-16 prose prose-slate prose-lg max-w-none">
                            {renderContent()}
                        </div>

                        {/* Bottom Navigation */}
                        <div className="mt-8 flex justify-between items-center text-sm text-slate-500 px-4">
                            <button
                                onClick={prevPage}
                                disabled={page <= 1}
                                className="hover:text-blue-600 disabled:opacity-50 transition-colors flex items-center"
                            >
                                <ChevronLeft size={16} className="mr-1" /> Previous Page
                            </button>
                            <span>
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={nextPage}
                                disabled={page >= totalPages}
                                className="hover:text-blue-600 disabled:opacity-50 transition-colors flex items-center"
                            >
                                Next Page <ChevronRight size={16} className="ml-1" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDFReader;
