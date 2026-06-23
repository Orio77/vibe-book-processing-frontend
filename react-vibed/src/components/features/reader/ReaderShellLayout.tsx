import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LoadingSpinner, Modal, Toast } from '@/components/ui';
import { ReaderSidebar } from './ReaderSidebar';
import { ReaderToolbar } from './ReaderToolbar';
import { RequestQueuePanel } from './RequestQueuePanel';
import { SummaryViewer } from '../SummaryViewer';
import { IdeaArgumentsModal } from '../IdeaArgumentsModal';
import { ChatResponseModal } from '../ChatResponseModal';
import { ExportOfflinePackModal } from '../ExportOfflinePackModal';
import { OfflineLlmSettingsModal } from '../OfflineLlmSettingsModal';
import { ReaderSettingsPanel } from './ReaderSettingsPanel';


type ReaderModeLayerProps = Pick<
    any,
    | 'readerViewWrapperClassName'
    | 'readerViewContainerRef'
    | 'handleReaderPointerDown'
    | 'handleReaderPointerMove'
    | 'handleReaderPointerEnd'
    | 'readerViewContentClassName'
    | 'readerSettings'
    | 'isHorizontalReaderScroll'
    | 'bookContent'
    | 'shouldShowEdgeClickZones'
    | 'goByDirection'
    | 'canGoBackward'
    | 'canGoForward'
    | 'pullIndicator'
    | 'pullIndicatorPositionClassName'
>;

function ReaderModeLayer(props: Readonly<ReaderModeLayerProps>) {
    const {
        readerViewWrapperClassName,
        readerViewContainerRef,
        handleReaderPointerDown,
        handleReaderPointerMove,
        handleReaderPointerEnd,
        readerViewContentClassName,
        readerSettings,
        isHorizontalReaderScroll,
        bookContent,
        shouldShowEdgeClickZones,
        goByDirection,
        canGoBackward,
        canGoForward,
        pullIndicator,
        pullIndicatorPositionClassName,
    } = props;
    return (
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
                {bookContent}
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
    );
}

function ReaderStandardLayer(props: Readonly<any>) {
    const {
        progressPercentage,
        sidebarOpen,
        setSidebarOpen,
        pdfInfo,
        chapters,
        activeChapter,
        sessionMode,
        rehydratedToolJobs,
        onJumpToChapter,
        onSummaryUpdated,
        onQueueSummary,
        onResolveSummaryQueueJob,
        onQueueIdeaExtraction,
        onResolveIdeaExtractionQueueJob,
        onQueueIdeasExplanation,
        onResolveIdeasExplanationQueueJob,
        page,
        totalPages,
        toolbarExpanded,
        setToolbarExpanded,
        readerViewMode,
        onToggleReaderView,
        onOpenReaderSettings,
        onGoToPage,
        onPrevPage,
        onNextPage,
        summaryView,
        loadingSummary,
        summaries,
        onDeleteSummary,
        onOpenSummaryView,
        showIdeas,
        onToggleIdeas,
        showChat,
        onToggleChat,
        requests,
        pendingRequestCount,
        onOpenRequestQueue,
        onOpenExportPack,
        exportingPack,
        onOpenOfflineLlmSettings,
        libraryLinkTo,
        libraryLabel,
        onDownloadOfflineLibraryZip,
        bookContent,
        isMarkingMode,
        markedSentences,
        onRequestExplanation,
        onShowQueryBox,
        onExitMarkingMode,
        showQueryBox,
        queryText,
        onQueryTextChange,
        onSubmitQuery,
        requestQueueOpen,
        setRequestQueueOpen,
        onOpenRequestFromQueue,
        selectedIdeas,
        onCloseIdeaModal,
        onQueueIdeaExplanation,
        onResolveIdeaExplanationQueueJob,
        onOfflineAppendIdeaExplanation,
        rehydratedIdeaExplanationJobs,
        selectedChatResponse,
        onCloseChatModal,
        onDeleteChatResponse,
        onSaveChatResponse,
        exportPackModalOpen,
        setExportPackModalOpen,
        onConfirmOfflineExport,
        offlineLibraryUpdateTargets,
        llmSettingsOpen,
        setLlmSettingsOpen,
        selectedRequest,
        onCloseRequestModal,
        selectedRequestTitle,
        requestStatusNode,
        toast,
        onDismissToast,
        readerSettingsOpen,
        setReaderSettingsOpen,
        readerSettings,
        onUpdateReaderSettings,
        onResetReaderSettings,
    } = props;

    return (
        <>
            <div className="w-full h-1 bg-slate-200 z-30 flex-shrink-0">
                <div
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            <div className="flex flex-1 min-h-0 overflow-hidden relative">
                {sidebarOpen && (
                    <button
                        type="button"
                        className="fixed inset-0 z-[90] cursor-default bg-slate-900/30 backdrop-blur-sm transition-opacity md:hidden"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close sidebar"
                    />
                )}

                <ReaderSidebar
                    pdfInfo={pdfInfo}
                    chapters={chapters}
                    activeChapter={activeChapter}
                    sidebarOpen={sidebarOpen}
                    offlineMode={sessionMode === 'offline'}
                    onClose={() => setSidebarOpen(false)}
                    onJumpToChapter={onJumpToChapter}
                    onSummaryUpdated={onSummaryUpdated}
                    onQueueSummary={onQueueSummary}
                    onResolveSummaryQueueJob={onResolveSummaryQueueJob}
                    onQueueIdeaExtraction={onQueueIdeaExtraction}
                    onResolveIdeaExtractionQueueJob={onResolveIdeaExtractionQueueJob}
                    onQueueIdeasExplanation={onQueueIdeasExplanation}
                    onResolveIdeasExplanationQueueJob={onResolveIdeasExplanationQueueJob}
                    restoredPendingToolJobs={sessionMode === 'online' ? rehydratedToolJobs : undefined}
                />

                <div className="flex-1 flex flex-col min-w-0 relative">
                    <ReaderToolbar
                        page={page}
                        totalPages={totalPages}
                        activeChapter={activeChapter}
                        sidebarOpen={sidebarOpen}
                        onToggleSidebar={() => setSidebarOpen((open: boolean) => !open)}
                        toolbarExpanded={toolbarExpanded}
                        onToggleToolbar={() => setToolbarExpanded((expanded: boolean) => !expanded)}
                        readerViewMode={readerViewMode}
                        onToggleReaderView={onToggleReaderView}
                        onOpenReaderSettings={onOpenReaderSettings}
                        onGoToPage={onGoToPage}
                        onPrev={onPrevPage}
                        onNext={onNextPage}
                        summaryView={summaryView}
                        onToggleSummaryView={onOpenSummaryView}
                        showIdeas={showIdeas}
                        onToggleIdeas={onToggleIdeas}
                        showChat={showChat}
                        onToggleChat={onToggleChat}
                        requestCount={requests.length}
                        pendingRequestCount={pendingRequestCount}
                        onOpenRequestQueue={onOpenRequestQueue}
                        onExportOfflinePack={onOpenExportPack}
                        exportOfflinePackLoading={exportingPack}
                        onOpenOfflineLlmSettings={onOpenOfflineLlmSettings}
                        libraryLinkTo={libraryLinkTo}
                        libraryLabel={libraryLabel}
                        onDownloadOfflineLibraryZip={onDownloadOfflineLibraryZip}
                    />

                    {summaryView ? (
                        <div className="flex-1 min-h-0">
                            {loadingSummary ? (
                                <LoadingSpinner className="h-full" />
                            ) : (
                                <SummaryViewer
                                    summaries={summaries}
                                    onDeleteSummary={onDeleteSummary}
                                    chapterTitle={activeChapter?.title}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                            <div className="max-w-3xl mx-auto py-8 px-4 sm:px-8 lg:py-12">
                                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl min-h-[600px] p-8 sm:p-12 lg:p-16 prose prose-slate prose-lg max-w-none">
                                    {bookContent}
                                </div>

                                <div className="mt-8 flex justify-between items-center text-sm text-slate-500 px-4">
                                    <button
                                        onClick={onPrevPage}
                                        disabled={page <= 1}
                                        className="hover:text-blue-600 disabled:opacity-50 transition-colors flex items-center"
                                    >
                                        <ChevronLeft size={16} className="mr-1" /> Previous Page
                                    </button>
                                    <span>
                                        {page} / {totalPages}
                                    </span>
                                    <button
                                        onClick={onNextPage}
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
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-xl border border-slate-200 rounded-xl p-4 z-40 flex flex-col items-center animate-in slide-in-from-bottom flex-wrap min-w-[300px]">
                        <div className="flex items-center space-x-3 mb-2">
                            <span className="text-sm font-medium text-slate-600 mr-2">
                                {markedSentences.length} sentence{markedSentences.length !== 1 && 's'} selected
                            </span>
                            <button
                                onClick={onRequestExplanation}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm transition-colors"
                            >
                                Request Explanation
                            </button>
                            <button
                                onClick={onShowQueryBox}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm transition-colors"
                            >
                                Send Query
                            </button>
                            <button
                                onClick={onExitMarkingMode}
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
                                    onChange={(event) => onQueryTextChange(event.target.value)}
                                    placeholder="Ask a question about the selected sentences..."
                                    className="flex-1 min-h-[4rem] max-h-[8rem] resize-y p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent custom-scrollbar"
                                    autoFocus
                                />
                                <button
                                    onClick={onSubmitQuery}
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
                        onSelectRequest={onOpenRequestFromQueue}
                    />
                </Modal>

                <IdeaArgumentsModal
                    isOpen={selectedIdeas !== null}
                    onClose={onCloseIdeaModal}
                    ideas={selectedIdeas || []}
                    chapterId={activeChapter?.id}
                    onQueueIdeaExplanation={onQueueIdeaExplanation}
                    onResolveIdeaExplanationQueueJob={onResolveIdeaExplanationQueueJob}
                    onOfflineAppendIdeaExplanation={onOfflineAppendIdeaExplanation}
                    restoredPendingIdeaExplanationJobs={
                        sessionMode === 'online' ? rehydratedIdeaExplanationJobs : undefined
                    }
                />

                <ChatResponseModal
                    isOpen={selectedChatResponse !== null}
                    onClose={onCloseChatModal}
                    chatResponse={selectedChatResponse}
                    onDelete={onDeleteChatResponse}
                    onSave={onSaveChatResponse}
                />

                <ExportOfflinePackModal
                    isOpen={exportPackModalOpen}
                    onClose={() => setExportPackModalOpen(false)}
                    onConfirm={onConfirmOfflineExport}
                    busy={exportingPack}
                    libraryUpdateTargets={offlineLibraryUpdateTargets}
                />

                <OfflineLlmSettingsModal
                    isOpen={llmSettingsOpen}
                    onClose={() => setLlmSettingsOpen(false)}
                />

                <Modal
                    isOpen={selectedRequest !== null}
                    onClose={onCloseRequestModal}
                    title={selectedRequestTitle}
                >
                    <div className="space-y-4">
                        {selectedRequest?.sentences.length ? (
                            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                                <strong>Reference context:</strong>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    {selectedRequest?.sentences.map((sentence: any) => (
                                        <li key={sentence.id}>{sentence.content}</li>
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
                            {requestStatusNode}
                        </div>
                    </div>
                </Modal>

                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={onDismissToast}
                        variant={readerViewMode ? 'minimal' : 'default'}
                    />
                )}

                <Modal
                    isOpen={readerSettingsOpen}
                    onClose={() => setReaderSettingsOpen(false)}
                    title="Reader View Settings"
                >
                    <ReaderSettingsPanel
                        settings={readerSettings}
                        onUpdateSettings={onUpdateReaderSettings}
                        onResetSettings={onResetReaderSettings}
                        onDone={() => setReaderSettingsOpen(false)}
                    />
                </Modal>
            </div>
        </>
    );
}

export function ReaderShellLayout(props: Readonly<any>) {
    const modeLayerProps: ReaderModeLayerProps = {
        readerViewWrapperClassName: props.readerViewWrapperClassName,
        readerViewContainerRef: props.readerViewContainerRef,
        handleReaderPointerDown: props.handleReaderPointerDown,
        handleReaderPointerMove: props.handleReaderPointerMove,
        handleReaderPointerEnd: props.handleReaderPointerEnd,
        readerViewContentClassName: props.readerViewContentClassName,
        readerSettings: props.readerSettings,
        isHorizontalReaderScroll: props.isHorizontalReaderScroll,
        bookContent: props.bookContent,
        shouldShowEdgeClickZones: props.shouldShowEdgeClickZones,
        goByDirection: props.goByDirection,
        canGoBackward: props.canGoBackward,
        canGoForward: props.canGoForward,
        pullIndicator: props.pullIndicator,
        pullIndicatorPositionClassName: props.pullIndicatorPositionClassName,
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-slate-50 relative">
            {props.readerViewMode
                ? <ReaderModeLayer {...modeLayerProps} />
                : <ReaderStandardLayer {...props} />}
        </div>
    );
}
