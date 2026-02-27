import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft, Menu, Sparkles, BookOpen } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import type { Chapter } from '@/types';

interface ReaderToolbarProps {
    readonly page: number;
    readonly totalPages: number;
    readonly activeChapter: Chapter | undefined;
    readonly onToggleSidebar: () => void;
    readonly onGoToPage: (p: number) => void;
    readonly onPrev: () => void;
    readonly onNext: () => void;
    readonly summaryView: boolean;
    readonly onToggleSummaryView: () => void;
}

export function ReaderToolbar({
    page,
    totalPages,
    activeChapter,
    onToggleSidebar,
    onGoToPage,
    onPrev,
    onNext,
    summaryView,
    onToggleSummaryView,
}: ReaderToolbarProps) {
    return (
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 -ml-2 rounded-lg hover:bg-slate-100 md:hidden text-slate-500 transition-colors"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={20} />
                </button>
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

                {/* Summary view toggle — only shown when inside a chapter */}
                {activeChapter && (
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
            </div>
        </div>
    );
}
