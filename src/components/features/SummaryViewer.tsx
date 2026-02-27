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

const mdComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
    h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-3">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-semibold text-slate-800 mt-5 mb-2">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold text-slate-800 mt-4 mb-1.5">{children}</h3>,
    p: ({ children }) => <p className="text-slate-700 leading-relaxed text-[1.05rem] mb-4">{children}</p>,
    ul: ({ children }) => <ul className="space-y-1.5 pl-5 mb-4 list-none">{children}</ul>,
    ol: ({ children }) => <ol className="space-y-1.5 pl-5 mb-4 list-decimal">{children}</ol>,
    li: ({ children }) => (
        <li className="flex items-start gap-2.5 text-slate-700 leading-relaxed text-[1.05rem]">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
            <span>{children}</span>
        </li>
    ),
    strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
    em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
    blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-blue-200 pl-4 py-0.5 my-3 text-slate-600 italic">{children}</blockquote>
    ),
    code: ({ children }) => (
        <code className="bg-slate-100 text-slate-800 rounded px-1.5 py-0.5 text-[0.9em] font-mono">{children}</code>
    ),
    pre: ({ children }) => (
        <pre className="bg-slate-100 rounded-xl px-4 py-3 overflow-x-auto text-sm font-mono mb-4">{children}</pre>
    ),
    hr: () => <hr className="border-slate-200 my-6" />,
    table: ({ children }) => (
        <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">{children}</table>
        </div>
    ),
    th: ({ children }) => <th className="border border-slate-200 px-3 py-2 bg-slate-50 font-semibold text-slate-700 text-left">{children}</th>,
    td: ({ children }) => <td className="border border-slate-200 px-3 py-2 text-slate-700">{children}</td>,
};

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
}

const VersionItem: React.FC<VersionItemProps> = ({ summary, index, isSelected, onSelect }) => {
    const preview = summary.summaryText.slice(0, 80).trim() + (summary.summaryText.length > 80 ? '…' : '');

    return (
        <button
            onClick={onSelect}
            className={`w-full text-left px-3 py-3 rounded-xl border transition-all duration-150 ${isSelected
                ? 'bg-blue-50 border-blue-200 shadow-sm'
                : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                }`}
        >
            <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold uppercase tracking-wider ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                    Version {index + 1}
                </span>
                {isSelected && (
                    <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                        Viewing
                    </span>
                )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{preview}</p>
            <div className="flex items-center gap-1.5 mt-2">
                <Clock className="w-3 h-3 text-slate-300" />
                <span className="text-[10px] text-slate-400">{formatReadingTime(summary.summaryText)}</span>
                <span className="text-slate-200 mx-0.5">·</span>
                <span className="text-[10px] text-slate-400">{formatWordCount(summary.summaryText)}</span>
            </div>
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
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [historyOpen, setHistoryOpen] = useState(true);
    const [copied, setCopied] = useState(false);
    const [markdownMode, setMarkdownMode] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);

    // Keep selection valid or fall to latest
    let resolvedId: number | null;
    if (selectedId !== null && summaries.some(s => s.id === selectedId)) {
        resolvedId = selectedId;
    } else {
        resolvedId = summaries.at(-1)?.id ?? null;
    }

    const selectedSummary = summaries.find(s => s.id === resolvedId) ?? null;
    const selectedIndex = summaries.findIndex(s => s.id === resolvedId);

    // Reset to latest when summaries list changes (e.g. new one generated)
    useEffect(() => {
        setSelectedId(null);
    }, [summaries.length]);

    // Scroll content to top when switching version
    useEffect(() => {
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [resolvedId]);

    // Arrow keys to navigate versions
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' && selectedIndex > 0) {
                setSelectedId(summaries[selectedIndex - 1].id);
            }
            if (e.key === 'ArrowDown' && selectedIndex < summaries.length - 1) {
                setSelectedId(summaries[selectedIndex + 1].id);
            }
        },
        [selectedIndex, summaries],
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
        const remaining = summaries.filter(s => s.id !== id);
        setSelectedId(remaining.at(-1)?.id ?? null);
    };

    return (
        <div className="flex h-full min-h-0 bg-white">

            {/* ── Main reading area ── */}
            <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar min-w-0">
                {selectedSummary ? (
                    <div className="max-w-3xl mx-auto px-6 md:px-10 py-8 lg:py-12">

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
                                {summaries.length > 1 && (
                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
                                        v{selectedIndex + 1} of {summaries.length}
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

            {/* ── Version history sidebar ── */}
            {summaries.length > 0 && (
                <div className="w-60 flex-shrink-0 border-l border-slate-100 bg-slate-50/50 flex flex-col">
                    <button
                        onClick={() => setHistoryOpen(o => !o)}
                        className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 text-left hover:bg-slate-100/60 transition-colors"
                    >
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Versions
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400 bg-slate-200 rounded-full px-1.5 py-0.5 leading-none">
                                {summaries.length}
                            </span>
                            {historyOpen
                                ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            }
                        </div>
                    </button>

                    {historyOpen && (
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {summaries.map((s, i) => (
                                <VersionItem
                                    key={s.id}
                                    summary={s}
                                    index={i}
                                    isSelected={s.id === resolvedId}
                                    onSelect={() => setSelectedId(s.id)}
                                />
                            ))}
                        </div>
                    )}

                    {summaries.length > 1 && (
                        <p className="text-[10px] text-slate-400 text-center px-4 py-3 border-t border-slate-100">
                            ↑↓ arrow keys to navigate
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
