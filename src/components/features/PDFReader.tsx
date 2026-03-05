import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePdfReader } from '@/hooks';
import { LoadingSpinner } from '@/components/ui';
import { ReaderSidebar, ReaderToolbar, PageSkeleton, BlankPage } from './reader';
import { SummaryViewer } from './SummaryViewer';
import { getSummaryByChapterId, deleteChapterSummary, fetchIdeasByChapterId } from '@/lib/api';
import type { ChapterSummary, IdeaWithSentences } from '@/types';
import { IdeaArgumentsModal } from './IdeaArgumentsModal';

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

    // Summary view state — lives here so it survives sidebar interactions
    const [summaryView, setSummaryView] = useState(false);
    const [summaries, setSummaries] = useState<ChapterSummary[]>([]);
    const [loadingSummary, setLoadingSummary] = useState(false);

    // Ideas state
    const [showIdeas, setShowIdeas] = useState(false);
    const [ideas, setIdeas] = useState<IdeaWithSentences[]>([]);
    const [loadingIdeas, setLoadingIdeas] = useState(false);
    const [selectedIdeas, setSelectedIdeas] = useState<IdeaWithSentences[] | null>(null);

    // Fetch ideas when showIdeas is enabled
    useEffect(() => {
        if (showIdeas && activeChapter) {
            setLoadingIdeas(true);
            fetchIdeasByChapterId(activeChapter.id)
                .then(data => setIdeas(data))
                .catch(() => { })
                .finally(() => setLoadingIdeas(false));
        } else {
            setIdeas([]);
        }
    }, [showIdeas, activeChapter]);

    const sentenceIdeasMap = useMemo(() => {
        const map = new Map<number, IdeaWithSentences[]>();
        ideas.forEach(ideaWithSentences => {
            ideaWithSentences.sentences.forEach(s => {
                const list = map.get(s.sentenceId) || [];
                list.push(ideaWithSentences);
                map.set(s.sentenceId, list);
            });
        });
        return map;
    }, [ideas]);

    const handleIdeaClick = (sentenceIdeas: IdeaWithSentences[]) => {
        setSelectedIdeas(sentenceIdeas);
    };

    // Called by PDFTools after generating, or when the toolbar button is clicked
    const openSummaryView = useCallback((incoming?: ChapterSummary[]) => {
        if (incoming) {
            setSummaries(incoming);
            setSummaryView(true);
            return;
        }
        // Toggle: if already open, close; if closed, fetch then open
        if (summaryView) {
            setSummaryView(false);
            return;
        }
        if (!activeChapter) return;
        setLoadingSummary(true);
        getSummaryByChapterId(activeChapter.id)
            .then(data => {
                setSummaries(data);
                setSummaryView(true);
            })
            .catch(() => { /* silently ignore — user sees empty state */ })
            .finally(() => setLoadingSummary(false));
    }, [summaryView, activeChapter]);

    // Close summary when chapter changes
    const handleJumpToChapter = useCallback((ch: { startPage: number }) => {
        goToPage(ch.startPage);
        setSummaryView(false);
        setSidebarOpen(false);
    }, [goToPage]);

    const handleDeleteSummary = useCallback(async (summaryId: number) => {
        await deleteChapterSummary(summaryId);
        setSummaries(prev => {
            const remaining = prev.filter(s => s.id !== summaryId);
            if (remaining.length === 0) setSummaryView(false);
            return remaining;
        });
    }, []);

    if (metaLoading) {
        return <LoadingSpinner className="h-[calc(100vh-64px)]" size="lg" />;
    }

    const progressPercentage = (page / totalPages) * 100;

    const renderBookContent = () => {
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
                <div className="text-lg relative">
                    {loadingIdeas && (
                        <div className="absolute top-0 right-0 -mt-6 -mr-4 bg-white/80 p-2 rounded-lg shadow-sm backdrop-blur-sm shadow-blue-100 border border-blue-100 z-10 flex items-center text-sm text-blue-600">
                            <LoadingSpinner className="w-4 h-4 mr-2" />
                            Loading ideas...
                        </div>
                    )}
                    {sentences.map((s) => {
                        const ideasForSentence = sentenceIdeasMap.get(s.id);
                        const isIdea = showIdeas && ideasForSentence && ideasForSentence.length > 0;

                        if (isIdea) {
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => handleIdeaClick(ideasForSentence)}
                                    className="inline text-left font-inherit text-inherit leading-inherit m-0 p-0 border-0 bg-blue-200 hover:bg-blue-300 rounded px-0.5 transition-colors duration-200 cursor-pointer"
                                    style={{ font: 'inherit', letterSpacing: 'inherit', wordSpacing: 'inherit' }}
                                >
                                    {s.content}{' '}
                                </button>
                            );
                        }

                        return (
                            <span
                                key={s.id}
                                className="inline transition-colors duration-200 rounded px-0.5 hover:bg-blue-50 cursor-text"
                            >
                                {s.content}{' '}
                            </span>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-slate-200 z-30 flex-shrink-0">
                <div
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            {/* Reader body */}
            <div className="flex flex-1 min-h-0 overflow-hidden relative">

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
                    onJumpToChapter={handleJumpToChapter}
                    onViewSummary={openSummaryView}
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
                        summaryView={summaryView}
                        onToggleSummaryView={() => openSummaryView()}
                        showIdeas={showIdeas}
                        onToggleIdeas={() => setShowIdeas(prev => !prev)}
                    />

                    {summaryView ? (
                        /* ── Summary Panel ── */
                        <div className="flex-1 min-h-0">
                            {loadingSummary ? (
                                <LoadingSpinner className="h-full" />
                            ) : (
                                <SummaryViewer
                                    summaries={summaries}
                                    onDeleteSummary={handleDeleteSummary}
                                    chapterTitle={activeChapter?.title}
                                />
                            )}
                        </div>
                    ) : (
                        /* ── Book Content ── */
                        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                            <div className="max-w-3xl mx-auto py-8 px-4 sm:px-8 lg:py-12">
                                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl min-h-[600px] p-8 sm:p-12 lg:p-16 prose prose-slate prose-lg max-w-none">
                                    {renderBookContent()}
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
                    )}
                </div>

                <IdeaArgumentsModal
                    isOpen={selectedIdeas !== null}
                    onClose={() => setSelectedIdeas(null)}
                    ideas={selectedIdeas || []}
                />
            </div>{/* end Reader body */}
        </div>
    );
};

export default PDFReader;
