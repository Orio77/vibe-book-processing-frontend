import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { usePdfReader, useReaderIdeas, useReaderChat, useReaderSummary, useSentenceMarking, useReaderRequests, useReaderViewSettings, useToast } from '@/hooks';
import { LoadingSpinner, Modal, Toast } from '@/components/ui';
import { ReaderSidebar, ReaderToolbar, PageSkeleton, BlankPage, RequestQueuePanel } from './reader';
import { SummaryViewer } from './SummaryViewer';
import { IdeaArgumentsModal } from './IdeaArgumentsModal';
import { ChatResponseModal } from './ChatResponseModal';
import type { Sentence, PDFChatResponse } from '@/types';

const READER_THEME_CLASSES = {
    light: {
        background: 'bg-white',
        text: 'text-slate-800',
    },
    sepia: {
        background: 'bg-amber-50',
        text: 'text-amber-900',
    },
    dark: {
        background: 'bg-slate-950',
        text: 'text-slate-100',
    },
} as const;

const READER_TEXT_WIDTH_CLASSES = {
    narrow: 'max-w-2xl',
    medium: 'max-w-3xl',
    wide: 'max-w-5xl',
} as const;

const PAGE_FLIP_PULL_THRESHOLD = 120;

type PageFlipDirection = 'forward' | 'backward';

type PullIndicatorState = {
    active: boolean;
    direction: PageFlipDirection | null;
    progress: number;
};

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
    const [toolbarExpanded, setToolbarExpanded] = useState(false);
    const [readerViewMode, setReaderViewMode] = useState(false);
    const [readerSettingsOpen, setReaderSettingsOpen] = useState(false);
    const [requestQueueOpen, setRequestQueueOpen] = useState(false);
    const [isCoarsePointer, setIsCoarsePointer] = useState(false);
    const [pullIndicator, setPullIndicator] = useState<PullIndicatorState>({
        active: false,
        direction: null,
        progress: 0,
    });

    const readerViewContainerRef = useRef<HTMLDivElement | null>(null);
    const pullGestureRef = useRef<{
        pointerId: number | null;
        startX: number;
        startY: number;
        canForward: boolean;
        canBackward: boolean;
        active: boolean;
    }>({
        pointerId: null,
        startX: 0,
        startY: 0,
        canForward: false,
        canBackward: false,
        active: false,
    });

    const {
        settings: readerSettings,
        updateSettings: updateReaderSettings,
        resetSettings: resetReaderSettings,
    } = useReaderViewSettings(pdfInfo?.id ?? id ?? null);

    // ── Extracted domain hooks ──
    const {
        showIdeas,
        loadingIdeas,
        selectedIdeas,
        sentenceIdeasMap,
        toggleIdeas,
        handleIdeaClick,
        closeIdeaModal,
    } = useReaderIdeas(activeChapter);

    const {
        showChat,
        loadingChat,
        highlightedSentenceIds,
        selectedChatResponse,
        highlightedChatResponseIdx,
        sentenceChatIconMap,
        toggleChat,
        handleChatIconClick,
        handleDeleteChatResponse,
        handleSaveChatResponse,
        closeChatModal,
    } = useReaderChat(activeChapter, sentences);

    const {
        summaryView,
        summaries,
        loadingSummary,
        openSummaryView,
        syncSummaries,
        closeSummary,
        handleDeleteSummary,
    } = useReaderSummary(activeChapter);

    const {
        isMarkingMode,
        markedSentences,
        showQueryBox,
        queryText,
        setShowQueryBox,
        setQueryText,
        exitMarkingMode,
        handlePointerDown,
        handlePointerUp,
        handlePointerCancel,
        handlePointerMove,
        handlePointerEnter,
        handleSentenceKeyDown,
    } = useSentenceMarking(sentences);

    const {
        requests,
        selectedRequest,
        handleRequestExplanation,
        handleSendQuery,
        registerSummaryQueueJob,
        resolveSummaryQueueJob,
        registerIdeaExplanationQueueJob,
        resolveIdeaExplanationQueueJob,
        registerIdeaExtractionQueueJob,
        resolveIdeaExtractionQueueJob,
        openRequest,
        closeRequestModal,
    } = useReaderRequests(activeChapter, markedSentences, exitMarkingMode);

    const { toast, showToast, dismissToast } = useToast();
    const completedRequestToastIdsRef = useRef<Set<string>>(new Set());

    // ── Derived handlers ──

    const handleJumpToChapter = useCallback((ch: { startPage: number }) => {
        goToPage(ch.startPage);
        closeSummary();
        setSidebarOpen(false);
    }, [goToPage, closeSummary]);

    const handleExitReaderView = useCallback(() => {
        setReaderViewMode(false);
    }, []);

    const handleToggleReaderView = useCallback(() => {
        setReaderViewMode((prev) => {
            const next = !prev;
            if (next) {
                setSidebarOpen(false);
                closeSummary();
                exitMarkingMode();
                closeIdeaModal();
                closeChatModal();
                closeRequestModal();
                setRequestQueueOpen(false);
                setReaderSettingsOpen(false);
            }
            return next;
        });
    }, [closeSummary, exitMarkingMode, closeIdeaModal, closeChatModal, closeRequestModal]);

    const pendingRequestCount = requests.filter((request) => request.status === 'pending').length;

    const getRequestSuccessMessage = useCallback((requestType: 'query' | 'explain' | 'summary' | 'idea-explain' | 'idea-extract') => {
        if (requestType === 'summary') return 'Chapter summary is ready.';
        if (requestType === 'idea-explain') return 'Idea explanation is ready.';
        if (requestType === 'idea-extract') return 'Idea extraction is ready.';
        if (requestType === 'explain') return 'Explanation is ready.';
        return 'Chat response is ready.';
    }, []);

    const getRequestErrorMessage = useCallback((requestType: 'query' | 'explain' | 'summary' | 'idea-explain' | 'idea-extract') => {
        if (requestType === 'summary') return 'Chapter summary request failed.';
        if (requestType === 'idea-explain') return 'Idea explanation request failed.';
        if (requestType === 'idea-extract') return 'Idea extraction request failed.';
        if (requestType === 'explain') return 'Explanation request failed.';
        return 'Chat request failed.';
    }, []);

    const getSelectedRequestTitle = useCallback(() => {
        if (selectedRequest?.type === 'summary') return 'Chapter Summary';
        if (selectedRequest?.type === 'idea-explain') return 'Idea Explanation';
        if (selectedRequest?.type === 'idea-extract') return 'Idea Extraction';
        if (selectedRequest?.type === 'explain') return 'Explanation';
        return 'Chat Response';
    }, [selectedRequest?.type]);

    const handleOpenRequestFromQueue = useCallback((requestId: string) => {
        openRequest(requestId);
        setRequestQueueOpen(false);
    }, [openRequest]);

    const handleSubmitQuery = useCallback(() => {
        if (!queryText.trim()) return;
        handleSendQuery(queryText);
        setQueryText('');
        setShowQueryBox(false);
    }, [handleSendQuery, queryText, setQueryText, setShowQueryBox]);

    const handleQueueSummary = useCallback((chapterId: number, jobId: number) => {
        registerSummaryQueueJob(chapterId, jobId);
    }, [registerSummaryQueueJob]);

    const handleResolveSummaryQueueJob = useCallback((jobId: number, status: 'success' | 'error', response: string) => {
        resolveSummaryQueueJob(jobId, status, response);
    }, [resolveSummaryQueueJob]);

    const handleQueueIdeaExplanation = useCallback((chapterId: number, ideaTitle: string, jobId: number) => {
        registerIdeaExplanationQueueJob(chapterId, ideaTitle, jobId);
    }, [registerIdeaExplanationQueueJob]);

    const handleResolveIdeaExplanationQueueJob = useCallback((jobId: number, status: 'success' | 'error', response: string) => {
        resolveIdeaExplanationQueueJob(jobId, status, response);
    }, [resolveIdeaExplanationQueueJob]);

    const handleQueueIdeaExtraction = useCallback((chapterId: number, jobId: number) => {
        registerIdeaExtractionQueueJob(chapterId, jobId);
    }, [registerIdeaExtractionQueueJob]);

    const handleResolveIdeaExtractionQueueJob = useCallback((jobId: number, status: 'success' | 'error', response: string) => {
        resolveIdeaExtractionQueueJob(jobId, status, response);
    }, [resolveIdeaExtractionQueueJob]);

    useEffect(() => {
        requests.forEach((request) => {
            const isDone = request.status === 'success' || request.status === 'error';
            if (!isDone) return;
            if (completedRequestToastIdsRef.current.has(request.id)) return;

            completedRequestToastIdsRef.current.add(request.id);
            if (readerViewMode) return;

            if (request.status === 'success') {
                const message = getRequestSuccessMessage(request.type);
                showToast(message, 'success');
                return;
            }

            const message = getRequestErrorMessage(request.type);
            showToast(message, 'error');
        });
    }, [getRequestErrorMessage, getRequestSuccessMessage, readerViewMode, requests, showToast]);

    useEffect(() => {
        if (!readerViewMode) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleExitReaderView();
            }
        };

        globalThis.addEventListener('keydown', handleKeyDown);
        return () => {
            globalThis.removeEventListener('keydown', handleKeyDown);
        };
    }, [readerViewMode, handleExitReaderView]);

    useEffect(() => {
        if (!readerViewMode) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [readerViewMode]);

    useEffect(() => {
        if (typeof globalThis.matchMedia !== 'function') {
            return;
        }

        const mediaQuery = globalThis.matchMedia('(pointer: coarse)');
        const sync = () => setIsCoarsePointer(mediaQuery.matches);
        sync();

        mediaQuery.addEventListener('change', sync);
        return () => {
            mediaQuery.removeEventListener('change', sync);
        };
    }, []);

    useEffect(() => {
        if (!readerViewMode) {
            setPullIndicator({ active: false, direction: null, progress: 0 });
            pullGestureRef.current = {
                pointerId: null,
                startX: 0,
                startY: 0,
                canForward: false,
                canBackward: false,
                active: false,
            };
        }
    }, [readerViewMode]);

    if (metaLoading) {
        return <LoadingSpinner className="h-[calc(100vh-64px)]" size="lg" />;
    }

    const progressPercentage = (page / totalPages) * 100;
    const canGoBackward = page > 1;
    const canGoForward = page < totalPages;

    const goByDirection = (direction: PageFlipDirection) => {
        if (direction === 'forward') {
            if (canGoForward) nextPage();
            return;
        }

        if (canGoBackward) {
            prevPage();
        }
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
        if (readerViewMode) {
            return (
                <span key={s.id} className="inline">
                    {s.content}{' '}
                </span>
            );
        }

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

        const chapterTitleClassName = readerViewMode
            ? 'text-3xl sm:text-4xl font-bold tracking-tight mb-2'
            : 'text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2';

        const chapterDividerClassName = readerViewMode
            ? 'mb-10 pb-6 border-b border-current/20'
            : 'mb-10 pb-6 border-b border-slate-100';

        const contentClassName = readerViewMode
            ? 'space-y-6 font-serif'
            : 'space-y-6 text-slate-800 leading-relaxed font-serif';

        const sentencesWrapperClassName = readerViewMode
            ? 'relative'
            : 'text-lg relative';

        return (
            <div className={contentClassName}>
                {activeChapter?.startPage === page && (
                    <div className={chapterDividerClassName}>
                        <h1 className={chapterTitleClassName}>
                            {activeChapter.title}
                        </h1>
                    </div>
                )}
                <div className={sentencesWrapperClassName}>
                    {loadingIdeas && !readerViewMode && (
                        <div className="absolute top-0 right-0 -mt-6 -mr-4 bg-white/80 p-2 rounded-lg shadow-sm backdrop-blur-sm shadow-blue-100 border border-blue-100 z-10 flex items-center text-sm text-blue-600">
                            <LoadingSpinner className="w-4 h-4 mr-2" />
                            Loading ideas...
                        </div>
                    )}
                    {loadingChat && !readerViewMode && (
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

    const isHorizontalReaderScroll = readerSettings.scrollMode === 'horizontal';
    let pullIndicatorPositionClassName = '';
    if (pullIndicator.direction !== null) {
        if (isHorizontalReaderScroll) {
            pullIndicatorPositionClassName = pullIndicator.direction === 'forward'
                ? 'right-6 top-1/2 -translate-y-1/2'
                : 'left-6 top-1/2 -translate-y-1/2';
        } else {
            pullIndicatorPositionClassName = pullIndicator.direction === 'forward'
                ? 'bottom-6 left-1/2 -translate-x-1/2'
                : 'top-6 left-1/2 -translate-x-1/2';
        }
    }

    const shouldShowEdgeClickZones = readerSettings.pageFlipEnabled && !isCoarsePointer;

    const resolvePullDirection = (delta: number, canBackwardPull: boolean, canForwardPull: boolean): PageFlipDirection | null => {
        if (delta > 0 && canBackwardPull) return 'backward';
        if (delta < 0 && canForwardPull) return 'forward';
        return null;
    };

    const handleReaderPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!readerSettings.pageFlipEnabled || event.pointerType !== 'touch') return;

        const container = readerViewContainerRef.current;
        if (!container) return;

        const maxVerticalScroll = Math.max(0, container.scrollHeight - container.clientHeight);
        const maxHorizontalScroll = Math.max(0, container.scrollWidth - container.clientWidth);
        const canBackwardPull = isHorizontalReaderScroll
            ? container.scrollLeft <= 2 && canGoBackward
            : container.scrollTop <= 2 && canGoBackward;
        const canForwardPull = isHorizontalReaderScroll
            ? container.scrollLeft >= maxHorizontalScroll - 2 && canGoForward
            : container.scrollTop >= maxVerticalScroll - 2 && canGoForward;

        pullGestureRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            canForward: canForwardPull,
            canBackward: canBackwardPull,
            active: canForwardPull || canBackwardPull,
        };

        if (canForwardPull || canBackwardPull) {
            event.currentTarget.setPointerCapture(event.pointerId);
        }
    };

    const handleReaderPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const pull = pullGestureRef.current;
        if (!pull.active || pull.pointerId !== event.pointerId) return;

        const delta = isHorizontalReaderScroll
            ? event.clientX - pull.startX
            : event.clientY - pull.startY;

        const direction = resolvePullDirection(delta, pull.canBackward, pull.canForward);
        if (!direction) {
            setPullIndicator({ active: false, direction: null, progress: 0 });
            return;
        }

        const progress = Math.min(1, Math.abs(delta) / PAGE_FLIP_PULL_THRESHOLD);
        setPullIndicator({ active: true, direction, progress });
        event.preventDefault();
    };

    const resetPullState = () => {
        pullGestureRef.current = {
            pointerId: null,
            startX: 0,
            startY: 0,
            canForward: false,
            canBackward: false,
            active: false,
        };
        setPullIndicator({ active: false, direction: null, progress: 0 });
    };

    const handleReaderPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
        const pull = pullGestureRef.current;
        if (!pull.active || pull.pointerId !== event.pointerId) return;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        const shouldFlip = pullIndicator.active && pullIndicator.direction !== null && pullIndicator.progress >= 1;
        const direction = pullIndicator.direction;
        resetPullState();

        if (shouldFlip && direction) {
            goByDirection(direction);
        }
    };
    const readerViewWrapperClassName = `fixed inset-0 z-50 ${isHorizontalReaderScroll ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto'} ${READER_THEME_CLASSES[readerSettings.theme].background}`;
    const readerViewContentClassName = isHorizontalReaderScroll
        ? `min-w-full py-8 px-6 sm:px-10 lg:py-12 ${READER_THEME_CLASSES[readerSettings.theme].text} font-serif`
        : `${READER_TEXT_WIDTH_CLASSES[readerSettings.textWidth]} mx-auto py-8 px-6 sm:px-10 lg:py-12 ${READER_THEME_CLASSES[readerSettings.theme].text} font-serif`;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative">
            {readerViewMode ? (
                <div
                    className={readerViewWrapperClassName}
                    ref={readerViewContainerRef}
                    onPointerDown={handleReaderPointerDown}
                    onPointerMove={handleReaderPointerMove}
                    onPointerUp={handleReaderPointerEnd}
                    onPointerCancel={handleReaderPointerEnd}
                >
                    <div
                        className={readerViewContentClassName}
                        style={{
                            fontSize: `${readerSettings.fontSize}px`,
                            lineHeight: readerSettings.lineHeight,
                            height: isHorizontalReaderScroll ? 'calc(100vh - 4rem)' : undefined,
                            columnWidth: isHorizontalReaderScroll ? 'min(42rem, calc(100vw - 6rem))' : undefined,
                            columnGap: isHorizontalReaderScroll ? '3rem' : undefined,
                            columnFill: isHorizontalReaderScroll ? 'auto' : undefined,
                        }}
                    >
                        {renderBookContent()}
                    </div>

                    {shouldShowEdgeClickZones && isHorizontalReaderScroll && (
                        <>
                            <button
                                type="button"
                                className="fixed left-0 top-0 bottom-0 w-1/5 z-20"
                                aria-label="Previous page"
                                onClick={() => goByDirection('backward')}
                                disabled={!canGoBackward}
                            />
                            <button
                                type="button"
                                className="fixed right-0 top-0 bottom-0 w-1/5 z-20"
                                aria-label="Next page"
                                onClick={() => goByDirection('forward')}
                                disabled={!canGoForward}
                            />
                        </>
                    )}

                    {shouldShowEdgeClickZones && !isHorizontalReaderScroll && (
                        <>
                            <button
                                type="button"
                                className="fixed left-0 right-0 top-0 h-1/5 z-20"
                                aria-label="Previous page"
                                onClick={() => goByDirection('backward')}
                                disabled={!canGoBackward}
                            />
                            <button
                                type="button"
                                className="fixed left-0 right-0 bottom-0 h-1/5 z-20"
                                aria-label="Next page"
                                onClick={() => goByDirection('forward')}
                                disabled={!canGoForward}
                            />
                        </>
                    )}

                    {readerSettings.pageFlipEnabled && pullIndicator.active && pullIndicator.direction && (
                        <div className={`fixed z-30 ${pullIndicatorPositionClassName}`}>
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg border border-white/50"
                                style={{
                                    background: `conic-gradient(#2563eb ${pullIndicator.progress * 360}deg, rgba(148,163,184,0.25) 0deg)`,
                                }}
                            >
                                <div className="w-10 h-10 rounded-full bg-white/95 text-[10px] font-semibold text-slate-700 flex items-center justify-center">
                                    {Math.round(pullIndicator.progress * 100)}%
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
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
                            onSummaryUpdated={syncSummaries}
                            onQueueSummary={handleQueueSummary}
                            onResolveSummaryQueueJob={handleResolveSummaryQueueJob}
                            onQueueIdeaExtraction={handleQueueIdeaExtraction}
                            onResolveIdeaExtractionQueueJob={handleResolveIdeaExtractionQueueJob}
                        />

                        {/* Main Content Area */}
                        <div className="flex-1 flex flex-col min-w-0 relative">
                            <ReaderToolbar
                                page={page}
                                totalPages={totalPages}
                                activeChapter={activeChapter}
                                sidebarOpen={sidebarOpen}
                                onToggleSidebar={() => setSidebarOpen((o) => !o)}
                                toolbarExpanded={toolbarExpanded}
                                onToggleToolbar={() => setToolbarExpanded((t) => !t)}
                                readerViewMode={readerViewMode}
                                onToggleReaderView={handleToggleReaderView}
                                onOpenReaderSettings={() => setReaderSettingsOpen(true)}
                                onGoToPage={goToPage}
                                onPrev={prevPage}
                                onNext={nextPage}
                                summaryView={summaryView}
                                onToggleSummaryView={() => openSummaryView()}
                                showIdeas={showIdeas}
                                onToggleIdeas={toggleIdeas}
                                showChat={showChat}
                                onToggleChat={toggleChat}
                                requestCount={requests.length}
                                pendingRequestCount={pendingRequestCount}
                                onOpenRequestQueue={() => setRequestQueueOpen(true)}
                            />

                            {summaryView ? (
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
                                <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                                    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-8 lg:py-12">
                                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl min-h-[600px] p-8 sm:p-12 lg:p-16 prose prose-slate prose-lg max-w-none">
                                            {renderBookContent()}
                                        </div>

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
                                            onClick={handleSubmitQuery}
                                            disabled={!queryText.trim()}
                                            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors mt-auto"
                                            aria-label="Send"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <Modal
                            isOpen={requestQueueOpen}
                            onClose={() => setRequestQueueOpen(false)}
                            title="Request Queue"
                        >
                            <RequestQueuePanel
                                requests={requests}
                                onSelectRequest={handleOpenRequestFromQueue}
                            />
                        </Modal>

                        <IdeaArgumentsModal
                            isOpen={selectedIdeas !== null}
                            onClose={closeIdeaModal}
                            ideas={selectedIdeas || []}
                            chapterId={activeChapter?.id}
                            onQueueIdeaExplanation={handleQueueIdeaExplanation}
                            onResolveIdeaExplanationQueueJob={handleResolveIdeaExplanationQueueJob}
                        />

                        <ChatResponseModal
                            isOpen={selectedChatResponse !== null}
                            onClose={closeChatModal}
                            chatResponse={selectedChatResponse}
                            onDelete={handleDeleteChatResponse}
                            onSave={handleSaveChatResponse}
                        />

                        <Modal
                            isOpen={selectedRequest !== null}
                            onClose={closeRequestModal}
                            title={getSelectedRequestTitle()}
                        >
                            <div className="space-y-4">
                                {selectedRequest?.sentences.length ? (
                                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                                        <strong>Reference context:</strong>
                                        <ul className="list-disc pl-5 mt-2 space-y-1">
                                            {selectedRequest?.sentences.map(s => (
                                                <li key={s.id}>{s.content}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                                        <strong>Request:</strong> {selectedRequest?.query ?? 'Queued summary generation'}
                                    </div>
                                )}
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

                        {toast && (
                            <Toast
                                message={toast.message}
                                type={toast.type}
                                onClose={dismissToast}
                                variant={readerViewMode ? 'minimal' : 'default'}
                            />
                        )}

                        <Modal
                            isOpen={readerSettingsOpen}
                            onClose={() => setReaderSettingsOpen(false)}
                            title="Reader View Settings"
                        >
                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="reader-font-size" className="block text-sm font-medium text-slate-700 mb-2">
                                        Font size ({readerSettings.fontSize}px)
                                    </label>
                                    <input
                                        id="reader-font-size"
                                        type="range"
                                        min={14}
                                        max={34}
                                        step={1}
                                        value={readerSettings.fontSize}
                                        onChange={(event) => updateReaderSettings({ fontSize: Number(event.target.value) })}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="reader-line-height" className="block text-sm font-medium text-slate-700 mb-2">
                                        Line spacing ({readerSettings.lineHeight.toFixed(1)})
                                    </label>
                                    <input
                                        id="reader-line-height"
                                        type="range"
                                        min={1.2}
                                        max={2.4}
                                        step={0.1}
                                        value={readerSettings.lineHeight}
                                        onChange={(event) => updateReaderSettings({ lineHeight: Number(event.target.value) })}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <span className="block text-sm font-medium text-slate-700 mb-2">Text width</span>
                                    <div className="flex gap-2">
                                        {[
                                            { key: 'narrow', label: 'Narrow' },
                                            { key: 'medium', label: 'Medium' },
                                            { key: 'wide', label: 'Wide' },
                                        ].map((option) => (
                                            <button
                                                key={option.key}
                                                type="button"
                                                onClick={() => updateReaderSettings({ textWidth: option.key as 'narrow' | 'medium' | 'wide' })}
                                                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${readerSettings.textWidth === option.key
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className="block text-sm font-medium text-slate-700 mb-2">Theme</span>
                                    <div className="flex gap-2">
                                        {[
                                            { key: 'light', label: 'Light' },
                                            { key: 'sepia', label: 'Sepia' },
                                            { key: 'dark', label: 'Dark' },
                                        ].map((option) => (
                                            <button
                                                key={option.key}
                                                type="button"
                                                onClick={() => updateReaderSettings({ theme: option.key as 'light' | 'sepia' | 'dark' })}
                                                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${readerSettings.theme === option.key
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className="block text-sm font-medium text-slate-700 mb-2">Scrolling</span>
                                    <div className="flex gap-2">
                                        {[
                                            { key: 'vertical', label: 'Vertical' },
                                            { key: 'horizontal', label: 'Horizontal' },
                                        ].map((option) => (
                                            <button
                                                key={option.key}
                                                type="button"
                                                onClick={() => updateReaderSettings({ scrollMode: option.key as 'vertical' | 'horizontal' })}
                                                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${readerSettings.scrollMode === option.key
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className="block text-sm font-medium text-slate-700 mb-2">Page flipping</span>
                                    <button
                                        type="button"
                                        onClick={() => updateReaderSettings({ pageFlipEnabled: !readerSettings.pageFlipEnabled })}
                                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${readerSettings.pageFlipEnabled
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {readerSettings.pageFlipEnabled ? 'Enabled' : 'Disabled'}
                                    </button>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                    <button
                                        type="button"
                                        onClick={resetReaderSettings}
                                        className="text-sm text-slate-600 hover:text-slate-800"
                                    >
                                        Reset to defaults
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReaderSettingsOpen(false)}
                                        className="px-3 py-1.5 rounded-lg text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </Modal>
                    </div>
                </>
            )}
        </div>
    );
};

export default PDFReader;
