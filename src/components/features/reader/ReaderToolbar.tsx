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
    'inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap shrink-0';

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
            <span className="hidden lg:inline">{readerViewMode ? 'Exit Reader View' : 'Reader View'}</span>
            <span className="lg:hidden">{readerViewMode ? 'Exit' : 'View'}</span>
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
            <span className="hidden lg:inline">Reader Settings</span>
            <span className="lg:hidden">Settings</span>
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
            Queue
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
            className="inline-flex h-9 w-9 shrink-0 -ml-1 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
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
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-3 sticky top-0 z-10">
            <div className="flex items-center gap-2 min-w-0">
                {!readerViewMode && (
                    <SidebarToggleButton
                        sidebarOpen={sidebarOpen}
                        onToggleSidebar={onToggleSidebar}
                    />
                )}
                <span className="text-sm text-slate-500 font-medium">
                    Page {page} / {totalPages}
                </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
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
                    onClick={onToggleToolbar}
                    className={`${toolbarCtrlClass} border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 gap-1`}
                    aria-label="Expand top bar"
                    aria-controls="reader-toolbar-content"
                    aria-expanded={toolbarExpanded}
                >
                    <ChevronDown size={16} className="shrink-0" />
                    <span className="hidden sm:inline">Expand bar</span>
                </button>
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
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-2 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50">
            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1 overflow-x-auto" id="reader-toolbar-content">
                {!readerViewMode && (
                    <SidebarToggleButton
                        sidebarOpen={sidebarOpen}
                        onToggleSidebar={onToggleSidebar}
                    />
                )}
                <Link
                    to={libraryLinkTo ?? ROUTES.HOME}
                    className="hidden sm:inline-flex items-center justify-center gap-1.5 h-9 shrink-0 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 px-3 rounded-lg border border-transparent hover:border-slate-200 whitespace-nowrap"
                >
                    <ArrowLeft size={16} className="shrink-0" /> {libraryLabel ?? 'Library'}
                </Link>

                <div className="h-5 w-px shrink-0 bg-slate-200 hidden sm:block" aria-hidden />

                {activeChapter ? (
                    <span className="text-sm font-medium text-slate-700 truncate min-w-0 max-w-[140px] sm:max-w-[200px] md:max-w-xs lg:max-w-md">
                        {activeChapter.title}
                    </span>
                ) : (
                    <span className="text-sm font-medium text-slate-400 italic shrink-0">
                        Unmapped section
                    </span>
                )}

                {activeChapter && !readerViewMode && (
                    <>
                        <div className="h-5 w-px shrink-0 bg-slate-200 hidden md:block" aria-hidden />
                        <button
                            onClick={onToggleSummaryView}
                            className={`${toolbarCtrlClass} border ${summaryView
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                                }`}
                        >
                            {summaryView
                                ? <><BookOpen size={14} className="shrink-0" /> Reading</>
                                : <><Sparkles size={14} className="shrink-0" /> Summary</>
                            }
                        </button>

                        <button
                            onClick={onToggleIdeas}
                            className={`${toolbarCtrlClass} border ${showIdeas
                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm hover:bg-amber-600'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                                }`}
                        >
                            <Lightbulb size={14} className="shrink-0" /> Ideas
                        </button>

                        <button
                            onClick={onToggleChat}
                            className={`${toolbarCtrlClass} border ${showChat
                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm hover:bg-teal-700'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200'
                                }`}
                        >
                            <MessageSquare size={14} className="shrink-0" /> Chat
                        </button>
                    </>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 h-9 pl-2 pr-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <input
                        type="number"
                        value={page}
                        onChange={(e) => {
                            const val = Number.parseInt(e.target.value, 10);
                            if (!Number.isNaN(val)) onGoToPage(val);
                        }}
                        className="h-7 w-10 sm:w-11 text-center text-sm bg-white border border-slate-200 rounded-md text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        aria-label="Page number"
                    />
                    <span className="text-sm text-slate-400 tabular-nums whitespace-nowrap">/ {totalPages}</span>
                </div>
                <div className="flex h-9 rounded-lg shadow-sm border border-slate-200 overflow-hidden shrink-0">
                    <button
                        type="button"
                        onClick={onPrev}
                        disabled={page <= 1}
                        className="flex items-center justify-center w-9 px-0 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition-colors border-r border-slate-200"
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={page >= totalPages}
                        className="flex items-center justify-center w-9 px-0 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition-colors"
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
                        className={`${toolbarCtrlClass} border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 gap-1`}
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
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                    aria-label="Collapse top bar"
                    aria-controls="reader-toolbar-content"
                    aria-expanded={toolbarExpanded}
                >
                    <ChevronUp size={18} />
                </button>
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
