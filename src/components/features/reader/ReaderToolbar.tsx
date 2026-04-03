import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowLeft, Menu, Sparkles, BookOpen, Lightbulb, MessageSquare, Settings2, ListTodo, Download, KeyRound, Loader2 } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import type { Chapter } from '@/types';

interface ReaderToolbarProps {
    readonly page: number;
    readonly totalPages: number;
    readonly activeChapter: Chapter | undefined;
    readonly sidebarOpen: boolean;
    readonly onToggleSidebar: () => void;
    readonly toolbarExpanded: boolean;
    readonly onToggleToolbar: () => void;
    readonly readerViewMode: boolean;
    readonly onToggleReaderView: () => void;
    readonly onOpenReaderSettings: () => void;
    readonly onGoToPage: (p: number) => void;
    readonly onPrev: () => void;
    readonly onNext: () => void;
    readonly summaryView: boolean;
    readonly onToggleSummaryView: () => void;
    readonly showIdeas: boolean;
    readonly onToggleIdeas: () => void;
    readonly showChat: boolean;
    readonly onToggleChat: () => void;
    readonly requestCount: number;
    readonly pendingRequestCount: number;
    readonly onOpenRequestQueue: () => void;
    readonly onExportOfflinePack?: () => void;
    readonly exportOfflinePackLoading?: boolean;
    readonly onOpenOfflineLlmSettings?: () => void;
    readonly libraryLinkTo?: string;
    readonly libraryLabel?: string;
    readonly onDownloadOfflineLibraryZip?: () => void;
}

interface ReaderViewToggleButtonProps {
    readonly readerViewMode: boolean;
    readonly onToggleReaderView: () => void;
}

interface ReaderSettingsButtonProps {
    readonly onOpenReaderSettings: () => void;
}

interface RequestQueueButtonProps {
    readonly requestCount: number;
    readonly pendingRequestCount: number;
    readonly onOpenRequestQueue: () => void;
}

const toolbarCtrlClass =
    'inline-flex shrink-0 touch-manipulation items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-2 text-xs font-medium transition-colors h-8 sm:h-9 sm:gap-1.5 sm:px-3 sm:text-sm';

const toolbarChromeClass =
    'border-b border-slate-200 bg-white/90 backdrop-blur-md pt-[max(0.375rem,env(safe-area-inset-top,0px))] sm:pt-[max(0.5rem,env(safe-area-inset-top,0px))]';

function ReaderViewToggleButton({
    readerViewMode,
    onToggleReaderView,
}: ReaderViewToggleButtonProps) {
    return (
        <button
            onClick={onToggleReaderView}
            className={`${toolbarCtrlClass} ${readerViewMode
                ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
            aria-label={readerViewMode ? 'Exit reader view' : 'Enter reader view'}
            aria-pressed={readerViewMode}
        >
            <BookOpen size={14} className="shrink-0" />
            <span className="hidden sm:inline">{readerViewMode ? 'Exit reader' : 'Reader view'}</span>
        </button>
    );
}

function ReaderSettingsButton({ onOpenReaderSettings }: ReaderSettingsButtonProps) {
    return (
        <button
            onClick={onOpenReaderSettings}
            className={`${toolbarCtrlClass} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
            aria-label="Open reader view settings"
        >
            <Settings2 size={14} className="shrink-0" />
            <span className="hidden sm:inline">Settings</span>
        </button>
    );
}

function RequestQueueButton({ requestCount, pendingRequestCount, onOpenRequestQueue }: RequestQueueButtonProps) {
    return (
        <button
            onClick={onOpenRequestQueue}
            className={`${toolbarCtrlClass} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
            aria-label="Open request queue"
            title="Open request queue"
        >
            <ListTodo size={14} className="shrink-0" />
            <span className="hidden min-[400px]:inline">Queue</span>
            {requestCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[1.35rem] h-5 px-1.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                    {pendingRequestCount > 0 ? `${pendingRequestCount}/${requestCount}` : requestCount}
                </span>
            )}
        </button>
    );
}

interface SidebarToggleButtonProps {
    readonly sidebarOpen: boolean;
    readonly onToggleSidebar: () => void;
}

function SidebarToggleButton({ sidebarOpen, onToggleSidebar }: SidebarToggleButtonProps) {
    return (
        <button
            type="button"
            onClick={onToggleSidebar}
            className="-ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 sm:h-9 sm:w-9"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-controls="reader-sidebar"
            aria-expanded={sidebarOpen}
        >
            <Menu size={20} />
        </button>
    );
}

function CollapsedToolbar({
    page,
    totalPages,
    sidebarOpen,
    onToggleSidebar,
    toolbarExpanded,
    onToggleToolbar,
    readerViewMode,
    onToggleReaderView,
    onOpenReaderSettings,
    requestCount,
    pendingRequestCount,
    onOpenRequestQueue,
    onOpenOfflineLlmSettings,
}: Pick<ReaderToolbarProps,
    | 'page'
    | 'totalPages'
    | 'sidebarOpen'
    | 'onToggleSidebar'
    | 'toolbarExpanded'
    | 'onToggleToolbar'
    | 'readerViewMode'
    | 'onToggleReaderView'
    | 'onOpenReaderSettings'
    | 'requestCount'
    | 'pendingRequestCount'
    | 'onOpenRequestQueue'
    | 'onOpenOfflineLlmSettings'
>) {
    return (
        <div className={`sticky top-0 z-10 ${toolbarChromeClass}`}>
            <div className="flex flex-col gap-2 px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
                <div className="flex min-w-0 items-center gap-2">
                    {!readerViewMode && (
                        <SidebarToggleButton
                            sidebarOpen={sidebarOpen}
                            onToggleSidebar={onToggleSidebar}
                        />
                    )}
                    <span className="truncate text-sm font-medium tabular-nums text-slate-500">
                        Page {page} / {totalPages}
                    </span>
                </div>

                <div className="flex min-w-0 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:shrink-0 sm:gap-2 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
                    <ReaderViewToggleButton
                        readerViewMode={readerViewMode}
                        onToggleReaderView={onToggleReaderView}
                    />

                    <ReaderSettingsButton onOpenReaderSettings={onOpenReaderSettings} />

                    <RequestQueueButton
                        requestCount={requestCount}
                        pendingRequestCount={pendingRequestCount}
                        onOpenRequestQueue={onOpenRequestQueue}
                    />

                    {onOpenOfflineLlmSettings && (
                        <button
                            type="button"
                            onClick={onOpenOfflineLlmSettings}
                            className={`${toolbarCtrlClass} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
                            aria-label="Offline LLM API settings"
                        >
                            <KeyRound size={16} className="shrink-0" />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onToggleToolbar}
                        className={`${toolbarCtrlClass} gap-1 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800`}
                        aria-label="Expand top bar"
                        aria-controls="reader-toolbar-content"
                        aria-expanded={toolbarExpanded}
                    >
                        <ChevronDown size={16} className="shrink-0" />
                        <span className="hidden sm:inline">More</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function ExpandedToolbar({
    page,
    totalPages,
    activeChapter,
    sidebarOpen,
    onToggleSidebar,
    toolbarExpanded,
    onToggleToolbar,
    readerViewMode,
    onToggleReaderView,
    onOpenReaderSettings,
    onGoToPage,
    onPrev,
    onNext,
    summaryView,
    onToggleSummaryView,
    showIdeas,
    onToggleIdeas,
    showChat,
    onToggleChat,
    requestCount,
    pendingRequestCount,
    onOpenRequestQueue,
    onExportOfflinePack,
    exportOfflinePackLoading,
    onOpenOfflineLlmSettings,
    libraryLinkTo,
    libraryLabel,
    onDownloadOfflineLibraryZip,
}: ReaderToolbarProps) {
    return (
        <div className={`sticky top-0 z-50 ${toolbarChromeClass}`}>
            <div className="flex flex-col gap-2 px-2 py-2 sm:px-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-3">
                <div
                    className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-wrap lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
                    id="reader-toolbar-content"
                >
                    {!readerViewMode && (
                        <SidebarToggleButton
                            sidebarOpen={sidebarOpen}
                            onToggleSidebar={onToggleSidebar}
                        />
                    )}
                    <Link
                        to={libraryLinkTo ?? ROUTES.HOME}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800 sm:hidden"
                        aria-label={libraryLabel ?? 'Back to library'}
                    >
                        <ArrowLeft size={18} className="shrink-0" />
                    </Link>
                    <Link
                        to={libraryLinkTo ?? ROUTES.HOME}
                        className="hidden h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-slate-50 px-3 text-sm font-medium whitespace-nowrap text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-800 sm:inline-flex"
                    >
                        <ArrowLeft size={16} className="shrink-0" /> {libraryLabel ?? 'Library'}
                    </Link>

                    <div className="hidden h-5 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />

                    {activeChapter ? (
                        <span className="min-w-0 max-w-[min(12rem,40vw)] shrink truncate text-sm font-medium text-slate-700 sm:max-w-[200px] md:max-w-xs lg:max-w-md">
                            {activeChapter.title}
                        </span>
                    ) : (
                        <span className="shrink-0 text-sm font-medium text-slate-400 italic">
                            Unmapped section
                        </span>
                    )}

                    {activeChapter && !readerViewMode && (
                        <>
                            <div className="hidden h-5 w-px shrink-0 bg-slate-200 md:block" aria-hidden />
                            <button
                                type="button"
                                onClick={onToggleSummaryView}
                                aria-label={summaryView ? 'Show reading view' : 'Show chapter summary'}
                                aria-pressed={summaryView}
                                className={`${toolbarCtrlClass} border ${summaryView
                                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                                    }`}
                            >
                                {summaryView
                                    ? <><BookOpen size={14} className="shrink-0" /><span className="hidden min-[360px]:inline">Reading</span></>
                                    : <><Sparkles size={14} className="shrink-0" /><span className="hidden min-[360px]:inline">Summary</span></>
                                }
                            </button>

                            <button
                                type="button"
                                onClick={onToggleIdeas}
                                aria-label={showIdeas ? 'Hide key ideas' : 'Show key ideas'}
                                aria-pressed={showIdeas}
                                className={`${toolbarCtrlClass} border ${showIdeas
                                    ? 'border-amber-500 bg-amber-500 text-white shadow-sm hover:bg-amber-600'
                                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700'
                                    }`}
                            >
                                <Lightbulb size={14} className="shrink-0" />
                                <span className="hidden min-[380px]:inline">Ideas</span>
                            </button>

                            <button
                                type="button"
                                onClick={onToggleChat}
                                aria-label={showChat ? 'Hide chat highlights' : 'Show chat highlights'}
                                aria-pressed={showChat}
                                className={`${toolbarCtrlClass} border ${showChat
                                    ? 'border-teal-600 bg-teal-600 text-white shadow-sm hover:bg-teal-700'
                                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700'
                                    }`}
                            >
                                <MessageSquare size={14} className="shrink-0" />
                                <span className="hidden min-[380px]:inline">Chat</span>
                            </button>
                        </>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 sm:gap-2 lg:border-t-0 lg:pt-0">
                    <div className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 pl-2 pr-2 sm:h-9 sm:pr-2.5">
                        <input
                            type="number"
                            value={page}
                            onChange={(e) => {
                                const val = Number.parseInt(e.target.value, 10);
                                if (!Number.isNaN(val)) onGoToPage(val);
                            }}
                            className="h-7 w-9 rounded-md border border-slate-200 bg-white text-center text-sm font-medium text-slate-700 outline-none transition-all [appearance:textfield] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:w-11 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            aria-label="Page number"
                        />
                        <span className="whitespace-nowrap text-xs tabular-nums text-slate-400 sm:text-sm">/ {totalPages}</span>
                    </div>
                    <div className="flex h-8 shrink-0 overflow-hidden rounded-lg border border-slate-200 shadow-sm sm:h-9">
                        <button
                            type="button"
                            onClick={onPrev}
                            disabled={page <= 1}
                            className="flex w-8 items-center justify-center border-r border-slate-200 bg-white px-0 text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 sm:w-9"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={onNext}
                            disabled={page >= totalPages}
                            className="flex w-8 items-center justify-center bg-white px-0 text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 sm:w-9"
                            aria-label="Next page"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    {(onExportOfflinePack || onDownloadOfflineLibraryZip) && (
                        <button
                            type="button"
                            onClick={onExportOfflinePack ?? onDownloadOfflineLibraryZip}
                            disabled={exportOfflinePackLoading}
                            className={`${toolbarCtrlClass} gap-1 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50`}
                            aria-label={onDownloadOfflineLibraryZip ? 'Download saved pack as ZIP' : 'Download offline pack'}
                        >
                            {exportOfflinePackLoading ? (
                                <Loader2 size={16} className="shrink-0 animate-spin" />
                            ) : (
                                <Download size={16} className="shrink-0" />
                            )}
                            <span className="hidden xl:inline">
                                {onDownloadOfflineLibraryZip ? 'Save ZIP' : 'Export pack'}
                            </span>
                        </button>
                    )}
                    {onOpenOfflineLlmSettings && (
                        <button
                            type="button"
                            onClick={onOpenOfflineLlmSettings}
                            className={`${toolbarCtrlClass} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
                            aria-label="Offline LLM API settings"
                        >
                            <KeyRound size={16} className="shrink-0" />
                            <span className="hidden xl:inline">API</span>
                        </button>
                    )}
                    <ReaderViewToggleButton
                        readerViewMode={readerViewMode}
                        onToggleReaderView={onToggleReaderView}
                    />
                    <ReaderSettingsButton onOpenReaderSettings={onOpenReaderSettings} />
                    <RequestQueueButton
                        requestCount={requestCount}
                        pendingRequestCount={pendingRequestCount}
                        onOpenRequestQueue={onOpenRequestQueue}
                    />
                    <button
                        type="button"
                        onClick={onToggleToolbar}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800 sm:h-9 sm:w-9"
                        aria-label="Collapse top bar"
                        aria-controls="reader-toolbar-content"
                        aria-expanded={toolbarExpanded}
                    >
                        <ChevronUp size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ReaderToolbar({
    ...props
}: ReaderToolbarProps) {
    if (!props.toolbarExpanded) {
        return <CollapsedToolbar {...props} />;
    }

    return <ExpandedToolbar {...props} />;
}
