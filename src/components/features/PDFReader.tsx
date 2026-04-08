import { useState, useCallback, type ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ReaderSessionProvider, useReaderSession } from '@/context/ReaderSessionContext';
import {
    useOfflineExportActions,
    usePdfReader,
    useReaderChat,
    useReaderIdeas,
    useReaderPageFlipGesture,
    useReaderRequests,
    useReaderRequestToasts,
    useReaderSummary,
    useReaderViewOverlay,
    useReaderViewSettings,
    useSentenceMarking,
    useToast,
} from '@/hooks';
import { LoadingSpinner } from '@/components/ui';
import { ReaderBookContent, ReaderShellLayout } from './reader';
import type { IdeaExplanationDTO } from '@/types';
import { getSummaryByChapterId } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import type { ReaderRequest } from '@/hooks/useReaderRequests';

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

type PageFlipDirection = 'forward' | 'backward';
type ReaderRequestType = 'query' | 'explain' | 'summary' | 'idea-explain' | 'idea-extract' | 'ideas-explain';

function getReaderRequestTitle(type: ReaderRequestType | undefined): string {
    if (type === 'summary') return 'Chapter Summary';
    if (type === 'idea-explain') return 'Idea Explanation';
    if (type === 'idea-extract') return 'Idea Extraction';
    if (type === 'ideas-explain') return 'Idea Explanations';
    if (type === 'explain') return 'Explanation';
    return 'Chat Response';
}

function renderRequestStatusNode(selectedRequest: ReaderRequest | null): ReactNode {
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
}

function applyPageDirection(
    direction: PageFlipDirection,
    canGoForward: boolean,
    canGoBackward: boolean,
    nextPage: () => void,
    prevPage: () => void,
) {
    if (direction === 'forward') {
        if (canGoForward) nextPage();
        return;
    }
    if (canGoBackward) {
        prevPage();
    }
}

function buildSessionLayoutActions(
    sessionMode: 'online' | 'offline',
    setExportPackModalOpen: (open: boolean) => void,
    setLlmSettingsOpen: (open: boolean) => void,
    handleDownloadOfflineLibraryZip: () => Promise<void>,
) {
    if (sessionMode === 'offline') {
        return {
            onOpenExportPack: undefined,
            onOpenOfflineLlmSettings: () => setLlmSettingsOpen(true),
            libraryLinkTo: ROUTES.READ_OFFLINE,
            libraryLabel: 'Offline library',
            onDownloadOfflineLibraryZip: handleDownloadOfflineLibraryZip,
        } as const;
    }

    return {
        onOpenExportPack: () => setExportPackModalOpen(true),
        onOpenOfflineLlmSettings: undefined,
        libraryLinkTo: undefined,
        libraryLabel: undefined,
        onDownloadOfflineLibraryZip: undefined,
    } as const;
}

export function PDFReaderShell() {
    const session = useReaderSession();
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
    } = usePdfReader();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [toolbarExpanded, setToolbarExpanded] = useState(false);
    const [readerSettingsOpen, setReaderSettingsOpen] = useState(false);
    const [requestQueueOpen, setRequestQueueOpen] = useState(false);
    const [llmSettingsOpen, setLlmSettingsOpen] = useState(false);

    const {
        settings: readerSettings,
        updateSettings: updateReaderSettings,
        resetSettings: resetReaderSettings,
    } = useReaderViewSettings(
        session.mode === 'offline'
            ? `offline:${session.bundle.manifest.exportId}`
            : (pdfInfo?.id ?? undefined),
    );

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

    const handleSummaryJobSettledForQueue = useCallback(async (chapterId: number) => {
        const data = await getSummaryByChapterId(chapterId);
        syncSummaries(data);
    }, [syncSummaries]);

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
        rehydratedToolJobs,
        rehydratedIdeaExplanationJobs,
        handleRequestExplanation,
        handleSendQuery,
        registerSummaryQueueJob,
        resolveSummaryQueueJob,
        registerIdeaExplanationQueueJob,
        resolveIdeaExplanationQueueJob,
        registerIdeaExtractionQueueJob,
        resolveIdeaExtractionQueueJob,
        registerIdeasExplanationQueueJob,
        resolveIdeasExplanationQueueJob,
        openRequest,
        closeRequestModal,
    } = useReaderRequests(activeChapter, markedSentences, exitMarkingMode, pdfInfo?.title, session.mode === 'online' && pdfInfo != null
        ? {
            pdfId: pdfInfo.id,
            onlinePersistence: true,
            onSummaryJobSettled: handleSummaryJobSettledForQueue,
        }
        : undefined);

    const { toast, showToast, dismissToast } = useToast();

    const {
        exportingPack,
        exportPackModalOpen,
        setExportPackModalOpen,
        offlineLibraryUpdateTargets,
        handleConfirmOfflineExport,
        handleDownloadOfflineLibraryZip,
    } = useOfflineExportActions({
        session,
        pdfInfoId: pdfInfo?.id,
        pdfTitle: pdfInfo?.title,
        page,
        showToast,
    });

    // ── Derived handlers ──

    const handleJumpToChapter = useCallback((ch: { startPage: number }) => {
        goToPage(ch.startPage);
        closeSummary();
        setSidebarOpen(false);
    }, [goToPage, closeSummary]);

    const handleEnterReaderView = useCallback(() => {
        setSidebarOpen(false);
        closeSummary();
        exitMarkingMode();
        closeIdeaModal();
        closeChatModal();
        closeRequestModal();
        setRequestQueueOpen(false);
        setReaderSettingsOpen(false);
    }, [closeSummary, exitMarkingMode, closeIdeaModal, closeChatModal, closeRequestModal]);

    const {
        readerViewMode,
        toggleReaderView: handleToggleReaderView,
    } = useReaderViewOverlay({ onEnterReaderView: handleEnterReaderView });

    const pendingRequestCount = requests.filter((request) => request.status === 'pending').length;

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

    const handleOfflineAppendIdeaExplanation = useCallback(
        (ideaId: number, row: IdeaExplanationDTO) => {
            if (session.mode !== 'offline') return;
            session.patchBook((draft) => {
                const list = draft.ideaExplanationsByIdeaId[ideaId] ?? [];
                draft.ideaExplanationsByIdeaId[ideaId] = [row, ...list];
            });
        },
        [session],
    );

    const handleQueueSummary = useCallback((chapterId: number, jobId: number) => {
        registerSummaryQueueJob(chapterId, jobId);
    }, [registerSummaryQueueJob]);

    const handleResolveSummaryQueueJob = useCallback((jobId: number, status: 'success' | 'error', response: string) => {
        resolveSummaryQueueJob(jobId, status, response);
    }, [resolveSummaryQueueJob]);

    const handleQueueIdeaExplanation = useCallback((chapterId: number, ideaTitle: string, jobId: number, ideaId: number) => {
        registerIdeaExplanationQueueJob(chapterId, ideaTitle, jobId, ideaId);
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

    const handleQueueIdeasExplanation = useCallback((chapterId: number, jobId: number) => {
        registerIdeasExplanationQueueJob(chapterId, jobId);
    }, [registerIdeasExplanationQueueJob]);

    const handleResolveIdeasExplanationQueueJob = useCallback((jobId: number, status: 'success' | 'error', response: string) => {
        resolveIdeasExplanationQueueJob(jobId, status, response);
    }, [resolveIdeasExplanationQueueJob]);

    useReaderRequestToasts({
        requests,
        readerViewMode,
        showToast,
    });

    const progressPercentage = (page / totalPages) * 100;
    const canGoBackward = page > 1;
    const canGoForward = page < totalPages;

    const goByDirection = useCallback((direction: PageFlipDirection) => {
        applyPageDirection(direction, canGoForward, canGoBackward, nextPage, prevPage);
    }, [canGoForward, canGoBackward, nextPage, prevPage]);

    const {
        isHorizontalReaderScroll,
        readerViewContainerRef,
        pullIndicator,
        pullIndicatorPositionClassName,
        shouldShowEdgeClickZones,
        handleReaderPointerDown,
        handleReaderPointerMove,
        handleReaderPointerEnd,
    } = useReaderPageFlipGesture({
        readerViewMode,
        pageFlipEnabled: readerSettings.pageFlipEnabled,
        scrollMode: readerSettings.scrollMode,
        canGoBackward,
        canGoForward,
        onFlipDirection: goByDirection,
    });

    if (metaLoading) {
        return <LoadingSpinner className="h-[calc(100vh-64px)]" size="lg" />;
    }

    const requestStatusNode = renderRequestStatusNode(selectedRequest);

    const bookContent = (
        <ReaderBookContent
            readerViewMode={readerViewMode}
            page={page}
            pageLoading={pageLoading}
            sentences={sentences}
            activeChapter={activeChapter}
            loadingIdeas={loadingIdeas}
            loadingChat={loadingChat}
            showIdeas={showIdeas}
            sentenceIdeasMap={sentenceIdeasMap as Map<number, unknown[]>}
            isMarkingMode={isMarkingMode}
            markedSentences={markedSentences}
            sentenceChatIconMap={sentenceChatIconMap}
            sessionMode={session.mode}
            showChat={showChat}
            highlightedSentenceIds={highlightedSentenceIds}
            highlightedChatResponseIdx={highlightedChatResponseIdx}
            handleChatIconClick={handleChatIconClick}
            handleIdeaClick={(ideas) => handleIdeaClick(ideas as never)}
            handlePointerDown={handlePointerDown}
            handlePointerMove={handlePointerMove}
            handlePointerUp={handlePointerUp}
            handlePointerCancel={handlePointerCancel}
            handlePointerEnter={handlePointerEnter}
            handleSentenceKeyDown={handleSentenceKeyDown}
        />
    );

    const readerViewWrapperClassName = `fixed inset-0 z-50 ${isHorizontalReaderScroll ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto'} ${READER_THEME_CLASSES[readerSettings.theme].background}`;
    const readerViewContentClassName = isHorizontalReaderScroll
        ? `min-w-full py-8 px-6 sm:px-10 lg:py-12 ${READER_THEME_CLASSES[readerSettings.theme].text} font-serif`
        : `${READER_TEXT_WIDTH_CLASSES[readerSettings.textWidth]} mx-auto py-8 px-6 sm:px-10 lg:py-12 ${READER_THEME_CLASSES[readerSettings.theme].text} font-serif`;

    const sessionLayoutActions = buildSessionLayoutActions(
        session.mode,
        setExportPackModalOpen,
        setLlmSettingsOpen,
        handleDownloadOfflineLibraryZip,
    );

    return (
        <ReaderShellLayout
            readerViewMode={readerViewMode}
            readerViewWrapperClassName={readerViewWrapperClassName}
            readerViewContainerRef={readerViewContainerRef}
            handleReaderPointerDown={handleReaderPointerDown}
            handleReaderPointerMove={handleReaderPointerMove}
            handleReaderPointerEnd={handleReaderPointerEnd}
            readerViewContentClassName={readerViewContentClassName}
            readerSettings={readerSettings}
            isHorizontalReaderScroll={isHorizontalReaderScroll}
            bookContent={bookContent}
            shouldShowEdgeClickZones={shouldShowEdgeClickZones}
            goByDirection={goByDirection}
            canGoBackward={canGoBackward}
            canGoForward={canGoForward}
            pullIndicator={pullIndicator}
            pullIndicatorPositionClassName={pullIndicatorPositionClassName}
            progressPercentage={progressPercentage}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            pdfInfo={pdfInfo}
            chapters={chapters}
            activeChapter={activeChapter}
            sessionMode={session.mode}
            rehydratedToolJobs={rehydratedToolJobs}
            onJumpToChapter={handleJumpToChapter}
            onSummaryUpdated={syncSummaries as unknown as (summary: unknown) => void}
            onQueueSummary={handleQueueSummary}
            onResolveSummaryQueueJob={handleResolveSummaryQueueJob}
            onQueueIdeaExtraction={handleQueueIdeaExtraction}
            onResolveIdeaExtractionQueueJob={handleResolveIdeaExtractionQueueJob}
            onQueueIdeasExplanation={handleQueueIdeasExplanation}
            onResolveIdeasExplanationQueueJob={handleResolveIdeasExplanationQueueJob}
            page={page}
            totalPages={totalPages}
            toolbarExpanded={toolbarExpanded}
            setToolbarExpanded={setToolbarExpanded}
            onToggleReaderView={handleToggleReaderView}
            onOpenReaderSettings={() => setReaderSettingsOpen(true)}
            onGoToPage={goToPage}
            onPrevPage={prevPage}
            onNextPage={nextPage}
            summaryView={summaryView}
            loadingSummary={loadingSummary}
            summaries={summaries}
            onDeleteSummary={handleDeleteSummary}
            onOpenSummaryView={openSummaryView}
            showIdeas={showIdeas}
            onToggleIdeas={toggleIdeas}
            showChat={showChat}
            onToggleChat={toggleChat}
            requests={requests}
            pendingRequestCount={pendingRequestCount}
            onOpenRequestQueue={() => setRequestQueueOpen(true)}
            exportingPack={exportingPack}
            onOpenExportPack={sessionLayoutActions.onOpenExportPack}
            onOpenOfflineLlmSettings={sessionLayoutActions.onOpenOfflineLlmSettings}
            libraryLinkTo={sessionLayoutActions.libraryLinkTo}
            libraryLabel={sessionLayoutActions.libraryLabel}
            onDownloadOfflineLibraryZip={sessionLayoutActions.onDownloadOfflineLibraryZip}
            isMarkingMode={isMarkingMode}
            markedSentences={markedSentences}
            onRequestExplanation={handleRequestExplanation}
            onShowQueryBox={() => setShowQueryBox(true)}
            onExitMarkingMode={exitMarkingMode}
            showQueryBox={showQueryBox}
            queryText={queryText}
            onQueryTextChange={setQueryText}
            onSubmitQuery={handleSubmitQuery}
            requestQueueOpen={requestQueueOpen}
            setRequestQueueOpen={setRequestQueueOpen}
            onOpenRequestFromQueue={handleOpenRequestFromQueue}
            selectedIdeas={selectedIdeas}
            onCloseIdeaModal={closeIdeaModal}
            onQueueIdeaExplanation={handleQueueIdeaExplanation}
            onResolveIdeaExplanationQueueJob={handleResolveIdeaExplanationQueueJob}
            onOfflineAppendIdeaExplanation={handleOfflineAppendIdeaExplanation}
            rehydratedIdeaExplanationJobs={rehydratedIdeaExplanationJobs}
            selectedChatResponse={selectedChatResponse}
            onCloseChatModal={closeChatModal}
            onDeleteChatResponse={handleDeleteChatResponse}
            onSaveChatResponse={handleSaveChatResponse}
            exportPackModalOpen={exportPackModalOpen}
            setExportPackModalOpen={setExportPackModalOpen}
            onConfirmOfflineExport={handleConfirmOfflineExport}
            offlineLibraryUpdateTargets={offlineLibraryUpdateTargets}
            llmSettingsOpen={llmSettingsOpen}
            setLlmSettingsOpen={setLlmSettingsOpen}
            selectedRequest={selectedRequest}
            onCloseRequestModal={closeRequestModal}
            selectedRequestTitle={getReaderRequestTitle(selectedRequest?.type)}
            requestStatusNode={requestStatusNode}
            toast={toast}
            onDismissToast={dismissToast}
            readerSettingsOpen={readerSettingsOpen}
            setReaderSettingsOpen={setReaderSettingsOpen}
            onUpdateReaderSettings={updateReaderSettings}
            onResetReaderSettings={resetReaderSettings}
        />
    );
}

export default function PDFReader() {
    const { id } = useParams<{ id: string }>();
    if (!id) {
        return <Navigate to={ROUTES.HOME} replace />;
    }
    return (
        <ReaderSessionProvider session={{ mode: 'online', pdfId: id }}>
            <PDFReaderShell />
        </ReaderSessionProvider>
    );
}
