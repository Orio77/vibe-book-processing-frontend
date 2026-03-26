import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowLeft, Menu, Sparkles, BookOpen, Lightbulb, MessageSquare, Settings2, ListTodo } from 'lucide-react';
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

function ReaderViewToggleButton({
    readerViewMode,
    onToggleReaderView,
}: ReaderViewToggleButtonProps) {
    return (
        <button
            onClick={onToggleReaderView}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${readerViewMode
                ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
            aria-label={readerViewMode ? 'Exit reader view' : 'Enter reader view'}
            aria-pressed={readerViewMode}
        >
            <BookOpen size={14} />
            {readerViewMode ? 'Exit Reader View' : 'Reader View'}
        </button>
    );
}

function ReaderSettingsButton({ onOpenReaderSettings }: ReaderSettingsButtonProps) {
    return (
        <button
            onClick={onOpenReaderSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
            aria-label="Open reader view settings"
        >
            <Settings2 size={14} />
            Reader Settings
        </button>
    );
}

function RequestQueueButton({ requestCount, pendingRequestCount, onOpenRequestQueue }: RequestQueueButtonProps) {
    return (
        <button
            onClick={onOpenRequestQueue}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
            aria-label="Open request queue"
            title="Open request queue"
        >
            <ListTodo size={14} />
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
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
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
>) {
    return (
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
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

            <div className="flex items-center gap-2">
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
                    onClick={onToggleToolbar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm font-medium"
                    aria-label="Expand top bar"
                    aria-controls="reader-toolbar-content"
                    aria-expanded={toolbarExpanded}
                >
                    <ChevronDown size={16} />
                    Expand bar
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
}: ReaderToolbarProps) {
    return (
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3" id="reader-toolbar-content">
                {!readerViewMode && (
                    <SidebarToggleButton
                        sidebarOpen={sidebarOpen}
                        onToggleSidebar={onToggleSidebar}
                    />
                )}
                <Link
                    to={ROUTES.HOME}
                    className="hidden sm:flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-md"
                >
                    <ArrowLeft size={16} className="mr-1.5" /> Library
                </Link>

                <div className="h-4 w-px bg-slate-200 hidden sm:block mx-2" />

                {activeChapter ? (
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[160px] sm:max-w-xs lg:max-w-md">
                        {activeChapter.title}
                    </span>
                ) : (
                    <span className="text-sm font-medium text-slate-400 italic">
                        Unmapped section
                    </span>
                )}

                {activeChapter && !readerViewMode && (
                    <>
                        <div className="h-4 w-px bg-slate-200 mx-1" />
                        <button
                            onClick={onToggleSummaryView}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${summaryView
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                                }`}
                        >
                            {summaryView
                                ? <><BookOpen size={14} /> Reading</>
                                : <><Sparkles size={14} /> Summary</>
                            }
                        </button>

                        <div className="h-4 w-px bg-slate-200 mx-1" />
                        <button
                            onClick={onToggleIdeas}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showIdeas
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                                }`}
                        >
                            <Lightbulb size={14} /> Ideas
                        </button>

                        <div className="h-4 w-px bg-slate-200 mx-1" />
                        <button
                            onClick={onToggleChat}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showChat
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200'
                                }`}
                        >
                            <MessageSquare size={14} /> Chat
                        </button>
                    </>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                    <span className="text-sm text-slate-500 px-2">
                        <input
                            type="number"
                            value={page}
                            onChange={(e) => {
                                const val = Number.parseInt(e.target.value);
                                if (!Number.isNaN(val)) onGoToPage(val);
                            }}
                            className="w-12 text-center bg-white border border-slate-200 rounded-md py-0.5 mx-1 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            aria-label="Page number"
                        />
                        <span className="text-slate-400">/ {totalPages}</span>
                    </span>
                </div>
                <div className="flex rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <button
                        onClick={onPrev}
                        disabled={page <= 1}
                        className="p-2 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition-colors border-r border-slate-200"
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={onNext}
                        disabled={page >= totalPages}
                        className="p-2 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition-colors"
                        aria-label="Next page"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
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
                    onClick={onToggleToolbar}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
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
