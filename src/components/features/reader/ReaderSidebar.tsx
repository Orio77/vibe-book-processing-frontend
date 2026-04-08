import { X } from 'lucide-react';
import PDFTools from '../PDFTools';
import type { Chapter, ChapterSummary } from '@/types';
import type { RehydratedToolJobs } from '@/hooks';

interface ReaderSidebarProps {
    readonly pdfInfo: { id: number; title: string } | null;
    readonly chapters: Chapter[];
    readonly activeChapter: Chapter | undefined;
    readonly sidebarOpen: boolean;
    /** When true, hide server-backed AI tools (summaries / idea extraction). */
    readonly offlineMode?: boolean;
    readonly onClose: () => void;
    readonly onJumpToChapter: (ch: Chapter) => void;
    readonly onSummaryUpdated: (summaries: ChapterSummary[]) => void;
    readonly onQueueSummary?: (chapterId: number, jobId: number) => void;
    readonly onResolveSummaryQueueJob?: (jobId: number, status: 'success' | 'error', response: string) => void;
    readonly onQueueIdeaExtraction?: (chapterId: number, jobId: number) => void;
    readonly onResolveIdeaExtractionQueueJob?: (jobId: number, status: 'success' | 'error', response: string) => void;
    readonly onQueueIdeasExplanation?: (chapterId: number, jobId: number) => void;
    readonly onResolveIdeasExplanationQueueJob?: (jobId: number, status: 'success' | 'error', response: string) => void;
    readonly restoredPendingToolJobs?: RehydratedToolJobs;
}

export function ReaderSidebar({
    pdfInfo,
    chapters,
    activeChapter,
    sidebarOpen,
    offlineMode = false,
    onClose,
    onJumpToChapter,
    onSummaryUpdated,
    onQueueSummary,
    onResolveSummaryQueueJob,
    onQueueIdeaExtraction,
    onResolveIdeaExtractionQueueJob,
    onQueueIdeasExplanation,
    onResolveIdeasExplanationQueueJob,
    restoredPendingToolJobs,
}: ReaderSidebarProps) {
    return (
        <div
            className={`
        fixed md:relative inset-y-0 left-0 z-[100] h-full max-h-[100dvh] bg-white shadow-xl transition-all duration-300 ease-in-out md:z-30 md:max-h-none md:shadow-none overflow-hidden
        ${sidebarOpen
                    ? 'w-[min(22rem,calc(100vw-0.5rem))] translate-x-0 border-r border-slate-200 md:w-72'
                    : 'w-0 -translate-x-full border-r-0 md:w-0 md:translate-x-0'
                }
      `}
            id="reader-sidebar"
            aria-hidden={!sidebarOpen}
        >
            <div className="flex h-full max-h-[inherit] flex-col">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] md:px-5 md:pb-5 md:pt-5">
                    <h2
                        className="font-semibold text-slate-800 truncate pr-4"
                        title={pdfInfo?.title}
                    >
                        {pdfInfo?.title ?? 'Document'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-y-contain custom-scrollbar pb-[env(safe-area-inset-bottom,0px)]">
                    <div className="p-4">
                        {/* AI Tools */}
                        {pdfInfo && !offlineMode && (
                            <div className="mb-8">
                                <PDFTools
                                    pdfId={pdfInfo.id}
                                    chapterId={activeChapter?.id ?? null}
                                    chapterCount={chapters.length}
                                    onSummaryUpdated={onSummaryUpdated}
                                    onQueueSummary={onQueueSummary}
                                    onResolveSummaryQueueJob={onResolveSummaryQueueJob}
                                    onQueueIdeaExtraction={onQueueIdeaExtraction}
                                    onResolveIdeaExtractionQueueJob={onResolveIdeaExtractionQueueJob}
                                    onQueueIdeasExplanation={onQueueIdeasExplanation}
                                    onResolveIdeasExplanationQueueJob={onResolveIdeasExplanationQueueJob}
                                    restoredPendingToolJobs={restoredPendingToolJobs}
                                />
                            </div>
                        )}

                        {/* Table of Contents */}
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Table of Contents
                            </h3>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {chapters.length}
                            </span>
                        </div>

                        {chapters.length === 0 ? (
                            <div className="text-center py-8 px-4 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                <p className="text-sm text-slate-500">No chapters found.</p>
                            </div>
                        ) : (
                            <ul className="space-y-1">
                                {chapters.map((chapter) => {
                                    const isActive = activeChapter?.id === chapter.id;
                                    return (
                                        <li key={chapter.id}>
                                            <button
                                                onClick={() => onJumpToChapter(chapter)}
                                                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group flex flex-col
                          ${isActive
                                                        ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100/50'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                    }
                        `}
                                            >
                                                <span
                                                    className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-blue-700' : 'text-slate-700 group-hover:text-slate-900'}`}
                                                >
                                                    {chapter.title}
                                                </span>
                                                <span
                                                    className={`text-xs mt-1 ${isActive ? 'text-blue-500' : 'text-slate-400'}`}
                                                >
                                                    Pages {chapter.startPage} - {chapter.endPage}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
