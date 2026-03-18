import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { usePdfReader, useReaderIdeas, useReaderChat, useReaderSummary, useSentenceMarking, useReaderRequests } from '@/hooks';
import { LoadingSpinner, Modal } from '@/components/ui';
import { ReaderSidebar, ReaderToolbar, PageSkeleton, BlankPage } from './reader';
import { SummaryViewer } from './SummaryViewer';
import { IdeaArgumentsModal } from './IdeaArgumentsModal';
import { ChatResponseModal } from './ChatResponseModal';
import type { Sentence, PDFChatResponse } from '@/types';

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
        closeRequestModal,
    } = useReaderRequests(activeChapter, markedSentences, exitMarkingMode);

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
            }
            return next;
        });
    }, [closeSummary, exitMarkingMode, closeIdeaModal, closeChatModal, closeRequestModal]);

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

    if (metaLoading) {
        return <LoadingSpinner className="h-[calc(100vh-64px)]" size="lg" />;
    }

    const progressPercentage = (page / totalPages) * 100;

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

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative">
            {readerViewMode ? (
                <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
                    <div className="max-w-3xl mx-auto py-8 px-6 sm:px-10 lg:py-12">
                        {renderBookContent()}
                    </div>
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
                            onViewSummary={openSummaryView}
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
                                onGoToPage={goToPage}
                                onPrev={prevPage}
                                onNext={nextPage}
                                summaryView={summaryView}
                                onToggleSummaryView={() => openSummaryView()}
                                showIdeas={showIdeas}
                                onToggleIdeas={toggleIdeas}
                                showChat={showChat}
                                onToggleChat={toggleChat}
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
                                            onClick={() => handleSendQuery(queryText)}
                                            disabled={!queryText.trim()}
                                            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors mt-auto"
                                            aria-label="Send"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                        </button>
                                    </div>
                                )}
                                <div className="hidden" aria-hidden="true" data-requests-count={requests.length}></div>
                            </div>
                        )}

                        <IdeaArgumentsModal
                            isOpen={selectedIdeas !== null}
                            onClose={closeIdeaModal}
                            ideas={selectedIdeas || []}
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
                    </div>
                </>
            )}
        </div>
    );
};

export default PDFReader;
