import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Trash2,
    Sparkles,
    FileText,
    Clock,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    Copy,
    Check,
} from 'lucide-react';
import type { ChapterSummary } from '@/types';
import { summaryMdComponents } from './markdown/mdComponents';

interface SummaryViewerProps {
    summaries: ChapterSummary[];
    onDeleteSummary: (id: number) => void;
    chapterTitle?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatWordCount(text: string): string {
    const count = text.trim().split(/\s+/).filter(Boolean).length;
    return `${count.toLocaleString()} word${count === 1 ? '' : 's'}`;
}

function formatReadingTime(text: string): string {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
}

// ---------------------------------------------------------------------------
// Delete Confirmation Dialog
// ---------------------------------------------------------------------------

interface DeleteConfirmProps {
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirm: React.FC<DeleteConfirmProps> = ({ onConfirm, onCancel }) => (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm animate-in fade-in slide-in-from-top-1 duration-150">
        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
        <span className="text-red-700 font-medium">Delete this summary?</span>
        <button
            onClick={onConfirm}
            className="ml-1 px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
        >
            Delete
        </button>
        <button
            onClick={onCancel}
            className="px-2.5 py-1 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
        >
            Cancel
        </button>
    </div>
);

// ---------------------------------------------------------------------------
// react-markdown component overrides — defined at module level to avoid
// re-creating component functions on every render (react-hooks/no-unstable-*)
// ---------------------------------------------------------------------------

const mdComponents = summaryMdComponents;

// ---------------------------------------------------------------------------
// Summary text renderer — plain or markdown
// ---------------------------------------------------------------------------

const SummaryBody: React.FC<{ text: string; markdown: boolean }> = ({ text, markdown }) => {
    if (markdown) {
        return (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {text}
            </ReactMarkdown>
        );
    }

    // Plain fallback — preserves paragraphs and bullet-like lines
    const paragraphs = text.split(/\n{2,}/).filter(Boolean);
    return (
        <div className="space-y-4">
            {paragraphs.map((para) => {
                const lines = para.split('\n').filter(Boolean);
                const isBulletBlock = lines.every(l => /^[-•*]\s/.test(l.trim()));
                const paraKey = para.slice(0, 40);

                if (isBulletBlock) {
                    return (
                        <ul key={paraKey} className="space-y-2 pl-1">
                            {lines.map((line) => (
                                <li key={line.slice(0, 40)} className="flex items-start gap-2.5 text-slate-700 leading-relaxed text-[1.05rem]">
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                    <span>{line.replace(/^[-•*]\s*/, '')}</span>
                                </li>
                            ))}
                        </ul>
                    );
                }

                return (
                    <p key={paraKey} className="text-slate-700 leading-relaxed text-[1.05rem]">
                        {para.replaceAll('\n', ' ')}
                    </p>
                );
            })}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Version list item
// ---------------------------------------------------------------------------

interface VersionItemProps {
    summary: ChapterSummary;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    compact?: boolean;
}

const VersionItem: React.FC<VersionItemProps> = ({
    summary,
    index,
    isSelected,
    onSelect,
    compact = false,
}) => {
    const preview = summary.summaryText.slice(0, 80).trim() + (summary.summaryText.length > 80 ? '…' : '');

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`rounded-xl border text-left transition-all duration-150 ${compact
                ? `min-w-[148px] max-w-[180px] shrink-0 px-2.5 py-2 ${isSelected
                    ? 'border-blue-200 bg-blue-50 shadow-sm'
                    : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                }`
                : `w-full px-3 py-3 ${isSelected
                    ? 'border-blue-200 bg-blue-50 shadow-sm'
                    : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                }`
                }`}
        >
            <div className={`flex items-center justify-between ${compact ? 'mb-0.5' : 'mb-1'}`}>
                <span className={`font-semibold uppercase tracking-wider ${compact ? 'text-[10px]' : 'text-xs'} ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                    {compact ? `V${index + 1}` : `Version ${index + 1}`}
                </span>
                {isSelected && (
                    <span className={`rounded-full bg-blue-600 font-bold text-white ${compact ? 'px-1 py-px text-[9px]' : 'px-1.5 py-0.5 text-[10px]'}`}>
                        {compact ? 'Now' : 'Viewing'}
                    </span>
                )}
            </div>
            <p className={`text-slate-500 leading-relaxed ${compact ? 'line-clamp-2 text-[10px]' : 'line-clamp-2 text-xs'}`}>{preview}</p>
            {!compact && (
                <div className="mt-2 flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-slate-300" />
                    <span className="text-[10px] text-slate-400">{formatReadingTime(summary.summaryText)}</span>
                    <span className="mx-0.5 text-slate-200">·</span>
                    <span className="text-[10px] text-slate-400">{formatWordCount(summary.summaryText)}</span>
                </div>
            )}
        </button>
    );
};

// ---------------------------------------------------------------------------
// Main SummaryViewer — inline panel, fills whatever container it's placed in
// ---------------------------------------------------------------------------

export const SummaryViewer: React.FC<SummaryViewerProps> = ({
    summaries,
    onDeleteSummary,
    chapterTitle = 'Chapter Summary',
}) => {
    const summaryList = Array.isArray(summaries) ? summaries : [];
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [historyOpen, setHistoryOpen] = useState(true);
    const [copied, setCopied] = useState(false);
    const [markdownMode, setMarkdownMode] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);

    // Keep selection valid or fall to latest
    let resolvedId: number | null;
    if (selectedId !== null && summaryList.some(s => s.id === selectedId)) {
        resolvedId = selectedId;
    } else {
        resolvedId = summaryList.at(-1)?.id ?? null;
    }

    const selectedSummary = summaryList.find(s => s.id === resolvedId) ?? null;
    const selectedIndex = summaryList.findIndex(s => s.id === resolvedId);

    // Scroll content to top when switching version
    useEffect(() => {
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [resolvedId]);

    // Arrow keys to navigate versions
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' && selectedIndex > 0) {
                setSelectedId(summaryList[selectedIndex - 1].id);
            }
            if (e.key === 'ArrowDown' && selectedIndex < summaryList.length - 1) {
                setSelectedId(summaryList[selectedIndex + 1].id);
            }
        },
        [selectedIndex, summaryList],
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleCopy = async () => {
        if (!selectedSummary) return;
        await navigator.clipboard.writeText(selectedSummary.summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = (id: number) => {
        setConfirmDeleteId(null);
        onDeleteSummary(id);
        const remaining = summaryList.filter(s => s.id !== id);
        setSelectedId(remaining.at(-1)?.id ?? null);
    };

    return (
        <div className="flex h-full min-h-0 flex-col bg-white md:flex-row">
            {/* ── Versions: horizontal strip on mobile, left sidebar on md+ ── */}
            {summaryList.length > 0 && (
                <aside
                    className="flex min-h-0 shrink-0 flex-col border-slate-200 bg-slate-50/90 md:h-full md:w-56 md:border-b-0 md:border-r lg:w-64 xl:w-72"
                    aria-label="Summary versions"
                >
                    <button
                        type="button"
                        onClick={() => setHistoryOpen((o) => !o)}
                        className="flex w-full shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2.5 text-left transition-colors hover:bg-slate-100/70 md:px-4 md:py-3.5"
                    >
                        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                            Versions
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-xs leading-none font-bold text-slate-500">
                                {summaryList.length}
                            </span>
                            {historyOpen
                                ? <ChevronUp className="h-3.5 w-3.5 text-slate-400 md:hidden" />
                                : <ChevronDown className="h-3.5 w-3.5 text-slate-400 md:hidden" />
                            }
                        </div>
                    </button>

                    {/* Mobile: collapsible horizontal scroller; md+: full-height vertical list */}
                    <div
                        className={`overflow-hidden border-b border-slate-100 transition-[max-height] duration-200 md:flex md:min-h-0 md:flex-1 md:max-h-none md:flex-col md:overflow-hidden md:border-b-0 ${historyOpen ? 'max-h-[min(42vh,280px)]' : 'max-h-0 md:max-h-none'}`}
                    >
                        <div className="flex gap-2 overflow-x-auto p-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
                            {summaryList.map((s, i) => (
                                <VersionItem
                                    key={s.id}
                                    summary={s}
                                    index={i}
                                    isSelected={s.id === resolvedId}
                                    onSelect={() => setSelectedId(s.id)}
                                    compact
                                />
                            ))}
                        </div>
                        <div className="custom-scrollbar hidden min-h-0 flex-1 flex-col space-y-2 overflow-y-auto p-3 md:flex">
                            {summaryList.map((s, i) => (
                                <VersionItem
                                    key={s.id}
                                    summary={s}
                                    index={i}
                                    isSelected={s.id === resolvedId}
                                    onSelect={() => setSelectedId(s.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {summaryList.length > 1 && (
                        <p className="hidden shrink-0 border-t border-slate-100 px-4 py-3 text-center text-[10px] text-slate-400 md:block">
                            ↑↓ arrow keys to navigate
                        </p>
                    )}
                </aside>
            )}

            {/* ── Main reading area (full remaining width) ── */}
            <div ref={contentRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto custom-scrollbar">
                {selectedSummary ? (
                    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-8 xl:max-w-5xl xl:px-12 xl:py-12">

                        {/* Chapter label */}
                        <div className="flex items-center gap-2.5 mb-6">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">AI Summary</p>
                                <p className="text-xs text-slate-500 leading-none mt-0.5" title={chapterTitle}>{chapterTitle}</p>
                            </div>
                        </div>

                        {/* Meta + actions bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-5 border-b border-slate-100">
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    {formatWordCount(selectedSummary.summaryText)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    {formatReadingTime(selectedSummary.summaryText)}
                                </span>
                                {summaryList.length > 1 && (
                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
                                        v{selectedIndex + 1} of {summaryList.length}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Markdown toggle */}
                                <button
                                    onClick={() => setMarkdownMode(m => !m)}
                                    title={markdownMode ? 'Switch to plain text' : 'Switch to markdown rendering'}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${markdownMode
                                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                        }`}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    MD
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                                {confirmDeleteId === selectedSummary.id ? (
                                    <DeleteConfirm
                                        onConfirm={() => handleDelete(selectedSummary.id)}
                                        onCancel={() => setConfirmDeleteId(null)}
                                    />
                                ) : (
                                    <button
                                        onClick={() => setConfirmDeleteId(selectedSummary.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Summary text */}
                        <SummaryBody text={selectedSummary.summaryText} markdown={markdownMode} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center mb-5 shadow-inner">
                            <FileText className="w-7 h-7 text-blue-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-800 mb-2">No summary yet</h3>
                        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                            Use <span className="font-medium text-slate-700">Generate Chapter Summary</span> from the AI Tools panel to create one.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
