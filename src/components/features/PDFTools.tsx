import type React from 'react';
import { useState, useCallback } from 'react';
import {
    Sparkles,
    BookOpen,
    Lightbulb,
    Target,
    Layers,
    Loader2,
} from 'lucide-react';
import {
    createChapterSummary,
    createBookSummary,
    markKeyIdeas,
    markExamples,
} from '@/lib/api';
import { useToast } from '@/hooks';
import { Toast } from '@/components/ui';
import type { LucideIcon } from 'lucide-react';

interface PDFToolsProps {
    pdfId: number;
    chapterId: number | null;
}

const PDFTools: React.FC<PDFToolsProps> = ({ pdfId, chapterId }) => {
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [bookContext, setBookContext] = useState(false);
    const { toast, showToast, dismissToast } = useToast();

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

    const handleChapterSummary = () => {
        if (!chapterId) return;
        runAction(
            'chapter-summary',
            () => createChapterSummary(pdfId, chapterId, bookContext),
            `Chapter summary created! (${bookContext ? 'With Book Context' : 'Chapter only'})`,
        );
    };

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
            () => markKeyIdeas(pdfId, chapterId),
            'Key ideas have been marked!',
        );
    };

    const handleMarkExamples = () => {
        if (!chapterId) return;
        runAction(
            'mark-examples',
            () => markExamples(pdfId, chapterId),
            'Examples have been marked!',
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
                {/* Context Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-sm font-medium text-slate-700">
                        Include Book Context
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer" aria-label="Include book context toggle">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={bookContext}
                            onChange={(e) => setBookContext(e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                </div>

                <div className="space-y-2">
                    <ToolButton
                        id="chapter-summary"
                        icon={BookOpen}
                        label="Chapter Summary"
                        onClick={handleChapterSummary}
                        disabled={!chapterId}
                        loadingAction={loadingAction}
                        colorClass="blue"
                        bgClass="bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                        hoverClass="hover:bg-blue-50/30"
                    />

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

                    <ToolButton
                        id="mark-examples"
                        icon={Target}
                        label="Find Examples"
                        onClick={handleMarkExamples}
                        disabled={!chapterId}
                        loadingAction={loadingAction}
                        colorClass="emerald"
                        bgClass="bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
                        hoverClass="hover:bg-emerald-50/30"
                    />
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

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group
        ${isDisabled
                    ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                    : `bg-white border-slate-200 text-slate-700 hover:border-${colorClass}-300 hover:shadow-sm ${hoverClass}`
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
                    className={`text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity text-${colorClass}-600`}
                >
                    Run →
                </span>
            )}
        </button>
    );
}

export default PDFTools;
