import type React from 'react';
import { useState, useCallback, useRef } from 'react';
import {
    Sparkles,
    BookOpen,
    Lightbulb,
    Layers,
    Loader2,
} from 'lucide-react';
import {
    createChapterSummary,
    fetchQueueJob,
    getSummaryByChapterId,
    createBookSummary,
    markKeyIdeas,
    getApiErrorMessage,
} from '@/lib/api';
import type { ChapterSummary } from '@/types';
import { useJobCompletionSubscription, useToast } from '@/hooks';
import { Toast } from '@/components/ui';
import type { LucideIcon } from 'lucide-react';

interface PDFToolsProps {
    pdfId: number;
    chapterId: number | null;
    chapterCount: number;
    onSummaryUpdated: (summaries: ChapterSummary[]) => void;
    onQueueSummary?: (chapterId: number, jobId: number) => void;
    onResolveSummaryQueueJob?: (jobId: number, status: 'success' | 'error', response: string) => void;
}

const PDFTools: React.FC<PDFToolsProps> = ({
    pdfId,
    chapterId,
    chapterCount,
    onSummaryUpdated,
    onQueueSummary,
    onResolveSummaryQueueJob,
}) => {
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const { toast, showToast, dismissToast } = useToast();
    const pendingSummaryJobsRef = useRef<Map<number, number>>(new Map());
    const processingSummaryJobRef = useRef<Set<number>>(new Set());

    const runAction = useCallback(
        async (id: string, action: () => Promise<void>, successMsg: string) => {
            setLoadingAction(id);
            try {
                await action();
                showToast(successMsg, 'success');
            } catch (err) {
                console.error(err);
                showToast(`Error: ${id.replaceAll('-', ' ')} failed.`, 'error');
            } finally {
                setLoadingAction(null);
            }
        },
        [showToast],
    );

    const handleChapterSummary = async () => {
        if (!chapterId) return;
        setLoadingAction('chapter-summary');
        try {
            const result = await createChapterSummary(chapterId);

            if (result.mode === 'queued') {
                pendingSummaryJobsRef.current.set(result.jobId, chapterId);
                onQueueSummary?.(chapterId, result.jobId);
                showToast('Chapter summary request queued.', 'success');
                return;
            }

            const allSummaries = await getSummaryByChapterId(chapterId);
            onSummaryUpdated(allSummaries);
            showToast('Chapter summary created!', 'success');
        } catch (err) {
            console.error(err);
            const errorMessage = getApiErrorMessage(err, 'Error: chapter summary failed.');
            showToast(errorMessage, 'error');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleChapterSummaryCompletion = useCallback(async (jobId: number) => {
        const chapterForJob = pendingSummaryJobsRef.current.get(jobId);
        if (chapterForJob == null || processingSummaryJobRef.current.has(jobId)) {
            return;
        }

        processingSummaryJobRef.current.add(jobId);

        try {
            const job = await fetchQueueJob(jobId);

            if (job.status !== 'COMPLETED') {
                const errorMessage = job.errorText?.trim() || 'Chapter summary generation failed.';
                onResolveSummaryQueueJob?.(jobId, 'error', errorMessage);
                showToast(errorMessage, 'error');
                return;
            }

            const allSummaries = await getSummaryByChapterId(chapterForJob);
            onSummaryUpdated(allSummaries);
            onResolveSummaryQueueJob?.(jobId, 'success', allSummaries.at(-1)?.summaryText ?? 'Chapter summary created.');
        } catch (error) {
            const errorMessage = getApiErrorMessage(error, 'Failed to resolve chapter summary completion.');
            onResolveSummaryQueueJob?.(jobId, 'error', errorMessage);
        } finally {
            pendingSummaryJobsRef.current.delete(jobId);
            processingSummaryJobRef.current.delete(jobId);
        }
    }, [onResolveSummaryQueueJob, onSummaryUpdated]);

    useJobCompletionSubscription(handleChapterSummaryCompletion);

    const handleBookSummary = () =>
        runAction(
            'book-summary',
            () => createBookSummary(pdfId),
            'Book summary created successfully!',
        );

    const handleMarkIdeas = () => {
        if (!chapterId) return;
        runAction(
            'mark-ideas',
            () => markKeyIdeas(chapterId),
            'Key ideas have been marked!',
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                    AI Tools
                </h3>
            </div>

            <div className="p-4 space-y-4">
                <div className="space-y-2">
                    <ToolButton
                        id="chapter-summary"
                        icon={BookOpen}
                        label="Generate Chapter Summary"
                        onClick={handleChapterSummary}
                        disabled={!chapterId}
                        loadingAction={loadingAction}
                        colorClass="blue"
                        bgClass="bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                        hoverClass="hover:bg-blue-50/30"
                    />

                    {chapterCount > 1 && (
                        <ToolButton
                            id="book-summary"
                            icon={Layers}
                            label="Book Summary"
                            onClick={handleBookSummary}
                            disabled={false}
                            loadingAction={loadingAction}
                            colorClass="purple"
                            bgClass="bg-purple-50 text-purple-600 group-hover:bg-purple-100"
                            hoverClass="hover:bg-purple-50/30"
                        />
                    )}

                    <ToolButton
                        id="mark-ideas"
                        icon={Lightbulb}
                        label="Extract Key Ideas"
                        onClick={handleMarkIdeas}
                        disabled={!chapterId}
                        loadingAction={loadingAction}
                        colorClass="amber"
                        bgClass="bg-amber-50 text-amber-600 group-hover:bg-amber-100"
                        hoverClass="hover:bg-amber-50/30"
                    />

                    {/* <ToolButton
                        id="mark-examples"
                        icon={Target}
                        label="Find Examples"
                        onClick={handleMarkExamples}
                        disabled={!chapterId}
                        loadingAction={loadingAction}
                        colorClass="emerald"
                        bgClass="bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
                        hoverClass="hover:bg-emerald-50/30"
                    /> */}
                </div>

                {!chapterId && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700 leading-relaxed">
                            Select a chapter from the table of contents to enable
                            chapter-specific tools.
                        </p>
                    </div>
                )}
            </div>

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={dismissToast} />
            )}

        </div>
    );
};

// ---------------------------------------------------------------------------
// Sub-component: ToolButton (typed props instead of `any`)
// ---------------------------------------------------------------------------

interface ToolButtonProps {
    readonly id: string;
    readonly icon: LucideIcon;
    readonly label: string;
    readonly onClick: () => void;
    readonly disabled: boolean;
    readonly loadingAction: string | null;
    readonly colorClass: string;
    readonly bgClass: string;
    readonly hoverClass: string;
}

function ToolButton({
    id,
    icon: Icon,
    label,
    onClick,
    disabled,
    loadingAction,
    colorClass,
    bgClass,
    hoverClass,
}: ToolButtonProps) {
    const isLoading = loadingAction === id;
    const isDisabled = disabled || loadingAction !== null;

    // Explicit hover-border / text-color maps so Tailwind can statically detect every class
    const hoverBorderMap: Record<string, string> = {
        blue: 'hover:border-blue-300',
        purple: 'hover:border-purple-300',
        amber: 'hover:border-amber-300',
        emerald: 'hover:border-emerald-300',
    };
    const textColorMap: Record<string, string> = {
        blue: 'text-blue-600',
        purple: 'text-purple-600',
        amber: 'text-amber-600',
        emerald: 'text-emerald-600',
    };

    const hoverBorder = hoverBorderMap[colorClass] ?? 'hover:border-slate-300';
    const runTextColor = textColorMap[colorClass] ?? 'text-slate-600';

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group
        ${isDisabled
                    ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                    : `bg-white border-slate-200 text-slate-700 ${hoverBorder} hover:shadow-sm ${hoverClass}`
                }
      `}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`p-2 rounded-lg ${isDisabled ? 'bg-slate-100 text-slate-400' : bgClass} transition-colors`}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Icon className="w-4 h-4" />
                    )}
                </div>
                <span className="text-sm font-medium">{label}</span>
            </div>
            {!isDisabled && !isLoading && (
                <span
                    className={`text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity ${runTextColor}`}
                >
                    Run →
                </span>
            )}
        </button>
    );
}

export default PDFTools;
