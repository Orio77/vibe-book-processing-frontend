import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { usePdfReader } from '@/hooks';
import { LoadingSpinner, Modal } from '@/components/ui';
import { ReaderSidebar, ReaderToolbar, PageSkeleton, BlankPage } from './reader';
import { SummaryViewer } from './SummaryViewer';
import { getSummaryByChapterId, deleteChapterSummary, fetchIdeasByChapterId, fetchChat, fetchExplanation, fetchChatResponsesForChapter, updateChatResponse, deleteChatResponse } from '@/lib/api';
import type { ChapterSummary, IdeaWithSentences, Sentence, PDFChatResponse } from '@/types';
import { IdeaArgumentsModal } from './IdeaArgumentsModal';
import { ChatResponseModal } from './ChatResponseModal';

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

    // Chat overlay state
    const [showChat, setShowChat] = useState(false);
    const [chatResponses, setChatResponses] = useState<PDFChatResponse[]>([]);
    const [loadingChat, setLoadingChat] = useState(false);
    const [highlightedSentenceIds, setHighlightedSentenceIds] = useState<Set<number>>(new Set());
    const [selectedChatResponse, setSelectedChatResponse] = useState<PDFChatResponse | null>(null);
    // tracks which sentence's chat icon was clicked first (for 2-click behaviour)
    const [highlightedChatResponseIdx, setHighlightedChatResponseIdx] = useState<string | null>(null);

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
    const isDraggingRef = useRef(false);
    const dragVisitedRef = useRef<Set<number>>(new Set());
    const dragActionRef = useRef<'mark' | 'unmark' | null>(null);

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

    // Fetch chat responses when showChat is enabled
    useEffect(() => {
        if (showChat && activeChapter) {
            setLoadingChat(true);
            setChatResponses([]);
            setHighlightedSentenceIds(new Set());
            setHighlightedChatResponseIdx(null);
            fetchChatResponsesForChapter(activeChapter.id)
                .then(data => setChatResponses(data))
                .catch((_error) => {
                    console.error('Failed to load chat responses:', _error);
                    setChatResponses([]);
                    setHighlightedSentenceIds(new Set());
                    setHighlightedChatResponseIdx(null);
                })
                .finally(() => setLoadingChat(false));
        } else {
            setChatResponses([]);
            setHighlightedSentenceIds(new Set());
            setHighlightedChatResponseIdx(null);
        }
    }, [showChat, activeChapter]);

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

    const sentenceByIdMap = useMemo(() => {
        return new Map(sentences.map(s => [s.id, s]));
    }, [sentences]);

    // Maps each sentence id to the list of chat responses that reference it
    const sentenceChatIconMap = useMemo(() => {
        // group chat responses by their context-sentence-set key
        const groupKey = (ids: number[]) => [...ids].sort((a, b) => a - b).join(',');
        const groupMap = new Map<string, PDFChatResponse[]>();
        chatResponses.forEach(cr => {
            const key = groupKey(cr.contextSentencesIds);
            const list = groupMap.get(key) || [];
            list.push(cr);
            groupMap.set(key, list);
        });

        // for each group, find the last sentence (by page order) in each
        // consecutive run among the page's sentences
        const sentenceIds = sentences.map(s => s.id);
        const result = new Map<number, PDFChatResponse[]>(); // sentenceId -> responses

        groupMap.forEach((responses) => {
            const contextSet = new Set(responses[0].contextSentencesIds);
            // walk the page's sentence list and collect runs
            let runEnd: number | null = null;
            sentenceIds.forEach((sid, idx) => {
                const inGroup = contextSet.has(sid);
                const nextInGroup = contextSet.has(sentenceIds[idx + 1] ?? -1);
                if (inGroup) {
                    runEnd = sid;
                    if (!nextInGroup) {
                        // this is the last in the consecutive run — place the icon here
                        result.set(runEnd, responses);
                        runEnd = null;
                    }
                }
            });
        });

        return result;
    }, [chatResponses, sentences]);

    const handleDeleteChatResponse = async (id: number) => {
        await deleteChatResponse(id);
        setChatResponses(prev => prev.filter(cr => cr.chatResponseId !== id));
        setHighlightedSentenceIds(new Set());
        setHighlightedChatResponseIdx(null);
    };

    const handleSaveChatResponse = async (id: number, newText: string) => {
        const updated = await updateChatResponse(id, newText);
        setChatResponses(prev => prev.map(cr => cr.chatResponseId === id ? updated : cr));
        setSelectedChatResponse(updated);
    };

    // tracks which sentence icon is currently in "highlighted" state, and
    // which response index within that group is next to be shown
    const handleIdeaClick = (sentenceIdeas: IdeaWithSentences[]) => {
        setSelectedIdeas(sentenceIdeas);
    };

    const handleChatIconClick = (cr: PDFChatResponse, sentenceId: number, idx: number) => {
        const key = `icon_${sentenceId}_${idx}`;

        if (highlightedChatResponseIdx === key) {
            // Second click: open modal and clear highlight
            setSelectedChatResponse(cr);
            setHighlightedSentenceIds(new Set());
            setHighlightedChatResponseIdx(null);
        } else {
            // First click: highlight all sentences for this response
            setHighlightedSentenceIds(new Set(cr.contextSentencesIds));
            setHighlightedChatResponseIdx(key);
            setSelectedChatResponse(null);
        }
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

    const addSentenceToMarked = (s: Sentence) => {
        setMarkedSentences(prev =>
            prev.some(m => m.id === s.id) ? prev : [...prev, s]
        );
    };

    const removeSentenceFromMarked = (s: Sentence) => {
        setMarkedSentences(prev => {
            const newMarks = prev.filter(m => m.id !== s.id);
            if (newMarks.length === 0) {
                setIsMarkingMode(false);
                setShowQueryBox(false);
            }
            return newMarks;
        });
    };

    const applyDragAction = (s: Sentence, action: 'mark' | 'unmark') => {
        if (dragVisitedRef.current.has(s.id)) return;
        dragVisitedRef.current.add(s.id);

        if (action === 'mark') {
            addSentenceToMarked(s);
            return;
        }
        removeSentenceFromMarked(s);
    };

    const resetDragState = () => {
        isDraggingRef.current = false;
        dragVisitedRef.current.clear();
        dragActionRef.current = null;
        if (holdTimeoutRef.current !== null) {
            globalThis.clearTimeout(holdTimeoutRef.current);
            holdTimeoutRef.current = null;
        }
    };

    const handlePointerDown = (e: React.PointerEvent, s: Sentence) => {
        const target = e.currentTarget as HTMLElement;
        const firstSentenceMarked = markedSentences.some(m => m.id === s.id);

        if (isMarkingMode) {
            isDraggingRef.current = true;
            dragVisitedRef.current.clear();
            dragActionRef.current = firstSentenceMarked ? 'unmark' : 'mark';
            target.setPointerCapture?.(e.pointerId);
            applyDragAction(s, dragActionRef.current);
            return;
        }

        holdTimeoutRef.current = globalThis.setTimeout(() => {
            holdTimeoutRef.current = null;
            isDraggingRef.current = true;
            dragVisitedRef.current.clear();
            dragActionRef.current = firstSentenceMarked ? 'unmark' : 'mark';
            setIsMarkingMode(true);
            target.setPointerCapture?.(e.pointerId);
            applyDragAction(s, dragActionRef.current);
            globalThis.navigator?.vibrate?.(50);
        }, 500);
    };

    const handlePointerUp = () => {
        resetDragState();
    };

    const handlePointerCancel = () => {
        resetDragState();
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isMarkingMode || !isDraggingRef.current || !dragActionRef.current) return;

        const element = document.elementFromPoint(e.clientX, e.clientY);
        const sentenceNode = element?.closest('[data-sentence-id]') as HTMLElement | null;
        if (!sentenceNode) return;

        const sentenceIdValue = sentenceNode.dataset.sentenceId;
        if (!sentenceIdValue) return;

        const sentenceId = Number.parseInt(sentenceIdValue, 10);
        if (Number.isNaN(sentenceId)) return;

        const sentence = sentenceByIdMap.get(sentenceId);
        if (!sentence) return;

        applyDragAction(sentence, dragActionRef.current);
    };

    // During a drag, entering a sentence applies the current drag action
    const handlePointerEnter = (s: Sentence) => {
        if (isMarkingMode && isDraggingRef.current && dragActionRef.current) {
            applyDragAction(s, dragActionRef.current);
        }
    };

    const toggleSentenceMark = (s: Sentence) => {
        const exists = markedSentences.some(m => m.id === s.id);
        if (exists) {
            removeSentenceFromMarked(s);
            return;
        }
        addSentenceToMarked(s);
    };

    const handleSentenceKeyDown = (e: React.KeyboardEvent, s: Sentence) => {
        if (!isMarkingMode) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSentenceMark(s);
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
        } catch (_error) {
            console.error('Failed to fetch explanation:', _error);
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
        } catch (_error) {
            console.error('Failed to fetch chat response:', _error);
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'error', response: 'Failed to fetch response.' } : r));
            setSelectedRequest(prev => prev?.id === reqId ? { ...prev, status: 'error', response: 'Failed to fetch response.' } : prev);
        }
    };

    const exitMarkingMode = () => {
        setIsMarkingMode(false);
        setMarkedSentences([]);
        setShowQueryBox(false);
        setQueryText('');
    };

    // ── Chat icon shade palette ──
    const CHAT_ICON_SHADES = [
        'bg-teal-100 text-teal-500 hover:bg-teal-200',
        'bg-teal-200 text-teal-600 hover:bg-teal-300',
        'bg-teal-300 text-teal-700 hover:bg-teal-400',
        'bg-teal-400 text-teal-800 hover:bg-teal-500',
        'bg-teal-500 text-white hover:bg-teal-600',
    ];

    const getChatIconTitle = (cr: PDFChatResponse): string => {
        if (!cr.query) return 'Explanation — click to highlight, click again to open';
        const truncated = cr.query.length > 60 ? `${cr.query.slice(0, 60)}…` : cr.query;
        return `"${truncated}" — click to highlight, click again to open`;
    };

    const renderChatIcons = (sentenceId: number, responses: PDFChatResponse[]) => (
        <span className="inline-flex items-center align-middle gap-px ml-0.5 mr-1">
            {responses.map((cr, idx) => {
                const iconKey = `icon_${sentenceId}_${idx}`;
                const isThisHighlighted = highlightedChatResponseIdx === iconKey;
                const shade = CHAT_ICON_SHADES[idx % CHAT_ICON_SHADES.length];
                const stableKey = `${sentenceId}-cr-${cr.contextSentencesIds.join('_')}-${idx}`;
                return (
                    <button
                        key={stableKey}
                        type="button"
                        title={getChatIconTitle(cr)}
                        onClick={() => handleChatIconClick(cr, sentenceId, idx)}
                        className={`inline-flex items-center justify-center w-4 h-4 rounded-full transition-colors cursor-pointer flex-shrink-0 ${isThisHighlighted ? 'ring-2 ring-teal-500 ring-offset-1' : ''
                            } ${shade}`}
                    >
                        <MessageSquare size={9} />
                    </button>
                );
            })}
        </span>
    );

    const getSentenceClassName = (isMarked: boolean, isChatHighlighted: boolean): string => {
        if (isMarked) return 'bg-yellow-200 cursor-pointer';
        if (isChatHighlighted) return 'bg-teal-100';
        if (isMarkingMode) return 'cursor-pointer hover:bg-slate-100';
        return 'hover:bg-blue-50 cursor-text';
    };

    const renderSentence = (s: Sentence) => {
        const ideasForSentence = sentenceIdeasMap.get(s.id);
        const isIdea = showIdeas && ideasForSentence && ideasForSentence.length > 0;
        const isMarked = markedSentences.some(m => m.id === s.id);
        const chatIconResponses = sentenceChatIconMap.get(s.id);
        const hasChatIcon = showChat && !isMarkingMode && !!chatIconResponses;
        const isChatHighlighted = highlightedSentenceIds.has(s.id);

        const chatIcons = hasChatIcon && chatIconResponses
            ? renderChatIcons(s.id, chatIconResponses)
            : null;

        if (isIdea && !isMarkingMode) {
            return (
                <span key={s.id} className="inline">
                    <button
                        type="button"
                        onClick={() => handleIdeaClick(ideasForSentence)}
                        className={`inline text-left font-inherit text-inherit leading-inherit m-0 p-0 border-0 rounded px-0.5 transition-colors duration-200 cursor-pointer ${isChatHighlighted
                            ? 'bg-teal-200 hover:bg-teal-300'
                            : 'bg-blue-200 hover:bg-blue-300'
                            }`}
                        style={{ font: 'inherit', letterSpacing: 'inherit', wordSpacing: 'inherit' }}
                    >
                        {s.content}
                    </button>
                    {chatIcons}{!chatIcons && ' '}
                </span>
            );
        }

        return (
            <span key={s.id} className="inline">
                <button
                    type="button"
                    data-sentence-id={s.id}
                    className={`inline text-left font-inherit text-inherit leading-inherit m-0 p-0 border-0 transition-colors duration-200 rounded px-0.5 ${getSentenceClassName(isMarked, isChatHighlighted)
                        }`}
                    style={{ font: 'inherit', letterSpacing: 'inherit', wordSpacing: 'inherit' }}
                    onPointerDown={(e) => handlePointerDown(e, s)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    onPointerEnter={() => handlePointerEnter(s)}
                    onKeyDown={(e) => handleSentenceKeyDown(e, s)}
                >
                    {s.content}
                </button>
                {chatIcons}{!chatIcons && ' '}
            </span>
        );
    };

    const renderRequestStatus = () => {
        if (selectedRequest?.status === 'pending') {
            return (
                <div className="flex items-center space-x-2 text-blue-600">
                    <LoadingSpinner size="sm" />
                    <span>Waiting for response from AI...</span>
                </div>
            );
        }
        if (selectedRequest?.status === 'error') {
            return <span className="text-red-500">{selectedRequest.response}</span>;
        }
        return <div className="whitespace-pre-wrap">{selectedRequest?.response}</div>;
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
                    {loadingChat && (
                        <div className="absolute top-0 right-0 -mt-6 -mr-4 bg-white/80 p-2 rounded-lg shadow-sm backdrop-blur-sm shadow-teal-100 border border-teal-100 z-10 flex items-center text-sm text-teal-600">
                            <LoadingSpinner className="w-4 h-4 mr-2" />
                            Loading chat responses...
                        </div>
                    )}
                    {sentences.map((s) => renderSentence(s))}
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
                        showChat={showChat}
                        onToggleChat={() => setShowChat(prev => !prev)}
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

                <ChatResponseModal
                    isOpen={selectedChatResponse !== null}
                    onClose={() => setSelectedChatResponse(null)}
                    chatResponse={selectedChatResponse}
                    onDelete={handleDeleteChatResponse}
                    onSave={handleSaveChatResponse}
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
                            {renderRequestStatus()}
                        </div>
                    </div>
                </Modal>
            </div>{/* end Reader body */}
        </div>
    );
};

export default PDFReader;
