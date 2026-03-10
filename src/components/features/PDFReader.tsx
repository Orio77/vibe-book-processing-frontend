import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePdfReader } from '@/hooks';
import { LoadingSpinner, Modal } from '@/components/ui';
import { ReaderSidebar, ReaderToolbar, PageSkeleton, BlankPage } from './reader';
import { SummaryViewer } from './SummaryViewer';
import { getSummaryByChapterId, deleteChapterSummary, fetchIdeasByChapterId, fetchChat, fetchExplanation } from '@/lib/api';
import type { ChapterSummary, IdeaWithSentences, Sentence } from '@/types';
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

    // Sentence marking mode state
    const [isMarkingMode, setIsMarkingMode] = useState(false);
    const [markedSentences, setMarkedSentences] = useState<Sentence[]>([]);
    const [showQueryBox, setShowQueryBox] = useState(false);
    const [queryText, setQueryText] = useState('');

    // In-memory requests storage
    const [requests, setRequests] = useState<Array<{
        id: string;
        type: 'explain' | 'query';
        query?: string;
        sentences: Sentence[];
        timestamp: Date;
        status: 'pending' | 'success' | 'error';
        response?: string;
    }>>([]);

    const [selectedRequest, setSelectedRequest] = useState<typeof requests[0] | null>(null);

    const holdTimeoutRef = useRef<number | null>(null);

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

    const handlePointerDown = (_e: React.PointerEvent, s: Sentence) => {
        if (!isMarkingMode) {
            holdTimeoutRef.current = window.setTimeout(() => {
                setIsMarkingMode(true);
                setMarkedSentences([s]);
                window.navigator?.vibrate?.(50);
            }, 500);
        }
    };

    const handlePointerUp = () => {
        if (holdTimeoutRef.current !== null) {
            window.clearTimeout(holdTimeoutRef.current);
            holdTimeoutRef.current = null;
        }
    };

    const handlePointerLeave = () => {
        if (holdTimeoutRef.current !== null) {
            window.clearTimeout(holdTimeoutRef.current);
            holdTimeoutRef.current = null;
        }
    };

    const handleSentenceClick = (_e: React.MouseEvent, s: Sentence) => {
        if (isMarkingMode) {
            setMarkedSentences(prev => {
                const exists = prev.some(m => m.id === s.id);
                if (exists) {
                    const newMarks = prev.filter(m => m.id !== s.id);
                    if (newMarks.length === 0) {
                        setIsMarkingMode(false);
                        setShowQueryBox(false);
                    }
                    return newMarks;
                } else {
                    return [...prev, s];
                }
            });
        }
    };

    const handleRequestExplanation = async () => {
        if (!activeChapter) return;

        const reqId = crypto.randomUUID();
        const requestPayload = {
            chapterId: activeChapter.id,
            context: markedSentences.map(s => ({ sentenceId: s.id, sentenceContent: s.content }))
        };

        const newRequest = {
            id: reqId,
            type: 'explain' as const,
            sentences: markedSentences,
            timestamp: new Date(),
            status: 'pending' as const,
        };

        setRequests(prev => [...prev, newRequest]);
        setSelectedRequest(newRequest);
        exitMarkingMode();

        try {
            const response = await fetchExplanation(requestPayload);
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'success', response } : r));
            setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'success', response } : prev);
        } catch (error) {
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'error', response: 'Failed to fetch explanation.' } : r));
            setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'error', response: 'Failed to fetch explanation.' } : prev);
        }
    };

    const handleSendQuery = async () => {
        if (!queryText.trim() || !activeChapter) return;

        const q = queryText;
        const reqId = crypto.randomUUID();
        const requestPayload = {
            chapterId: activeChapter.id,
            query: q,
            context: markedSentences.map(s => ({ sentenceId: s.id, sentenceContent: s.content }))
        };

        const newRequest = {
            id: reqId,
            type: 'query' as const,
            query: q,
            sentences: markedSentences,
            timestamp: new Date(),
            status: 'pending' as const,
        };

        setRequests(prev => [...prev, newRequest]);
        setSelectedRequest(newRequest);
        exitMarkingMode();

        try {
            const response = await fetchChat(requestPayload);
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'success', response } : r));
            setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'success', response } : prev);
        } catch (error) {
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'error', response: 'Failed to fetch response.' } : r));
            setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'error', response: 'Failed to fetch response.' } : prev);
        }
    }; const exitMarkingMode = () => {
        setIsMarkingMode(false);
        setMarkedSentences([]);
        setShowQueryBox(false);
        setQueryText('');
    };

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
                        const isMarked = markedSentences.some(m => m.id === s.id);

                        if (isIdea && !isMarkingMode) {
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
                                className={`inline transition-colors duration-200 rounded px-0.5 ${isMarked
                                    ? 'bg-yellow-200 cursor-pointer'
                                    : isMarkingMode
                                        ? 'cursor-pointer hover:bg-slate-100'
                                        : 'hover:bg-blue-50 cursor-text'
                                    }`}
                                onPointerDown={(e) => handlePointerDown(e, s)}
                                onPointerUp={handlePointerUp}
                                onPointerLeave={handlePointerLeave}
                                onClick={(e) => handleSentenceClick(e, s)}
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

                {/* Floating Marking Toolbar */}
                {isMarkingMode && markedSentences.length > 0 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-xl border border-slate-200 rounded-xl p-4 z-40 flex flex-col items-center animate-in slide-in-from-bottom flex-wrap min-w-[300px]">
                        <div className="flex items-center space-x-3 mb-2">
                            <span className="text-sm font-medium text-slate-600 mr-2">
                                {markedSentences.length} sentence{markedSentences.length !== 1 && 's'} selected
                            </span>
                            <button
                                onClick={handleRequestExplanation}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm transition-colors"
                            >
                                Request Explanation
                            </button>
                            <button
                                onClick={() => setShowQueryBox(true)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm transition-colors"
                            >
                                Send Query
                            </button>
                            <button
                                onClick={exitMarkingMode}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors ml-2"
                                aria-label="Cancel"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        {showQueryBox && (
                            <div className="w-full mt-3 flex items-start space-x-2 animate-in fade-in">
                                <textarea
                                    value={queryText}
                                    onChange={(e) => setQueryText(e.target.value)}
                                    placeholder="Ask a question about the selected sentences..."
                                    className="flex-1 min-h-[4rem] max-h-[8rem] resize-y p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent custom-scrollbar"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSendQuery}
                                    disabled={!queryText.trim()}
                                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors mt-auto"
                                    aria-label="Send"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                </button>
                            </div>
                        )}
                        {/* Hidden debug log for requests */}
                        <div className="hidden" aria-hidden="true" data-requests-count={requests.length}></div>
                    </div>
                )}

                <IdeaArgumentsModal
                    isOpen={selectedIdeas !== null}
                    onClose={() => setSelectedIdeas(null)}
                    ideas={selectedIdeas || []}
                />

                {/* Chat / Explanation Modal */}
                <Modal
                    isOpen={selectedRequest !== null}
                    onClose={() => setSelectedRequest(null)}
                    title={selectedRequest?.type === 'explain' ? 'Explanation' : 'Chat Response'}
                >
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                            <strong>Reference context:</strong>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                {selectedRequest?.sentences.map(s => (
                                    <li key={s.id}>{s.content}</li>
                                ))}
                            </ul>
                        </div>
                        {selectedRequest?.query && (
                            <div className="font-medium text-slate-800">
                                <strong>Q:</strong> {selectedRequest.query}
                            </div>
                        )}
                        <div className="mt-4 text-slate-800">
                            {selectedRequest?.status === 'pending' ? (
                                <div className="flex items-center space-x-2 text-blue-600">
                                    <LoadingSpinner size="sm" />
                                    <span>Waiting for response from AI...</span>
                                </div>
                            ) : selectedRequest?.status === 'error' ? (
                                <span className="text-red-500">{selectedRequest.response}</span>
                            ) : (
                                <div className="whitespace-pre-wrap">{selectedRequest?.response}</div>
                            )}
                        </div>
                    </div>
                </Modal>
            </div>{/* end Reader body */}
        </div>
    );
};

export default PDFReader;
