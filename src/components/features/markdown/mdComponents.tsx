import type React from 'react';
import type ReactMarkdown from 'react-markdown';

/**
 * Shared react-markdown component overrides.
 *
 * Defined at module level so they are stable across renders and avoid
 * react-hooks/no-unstable-* warnings when passed to `<ReactMarkdown>`.
 *
 * `accentColor` lets consumers tint bullet dots and blockquote borders
 * (default: blue for summaries, teal for chat, etc.).
 */
function createMdComponents(
    accentColor: 'blue' | 'teal' = 'blue',
): React.ComponentProps<typeof ReactMarkdown>['components'] {
    const dotColor = accentColor === 'teal' ? 'bg-teal-400' : 'bg-blue-400';
    const borderColor = accentColor === 'teal' ? 'border-teal-200' : 'border-blue-200';

    return {
        h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-semibold text-slate-800 mt-5 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold text-slate-800 mt-4 mb-1.5">{children}</h3>,
        p: ({ children }) => <p className="text-slate-700 leading-relaxed text-[1.05rem] mb-4">{children}</p>,
        ul: ({ children }) => <ul className="space-y-1.5 pl-5 mb-4 list-none">{children}</ul>,
        ol: ({ children }) => <ol className="space-y-1.5 pl-5 mb-4 list-decimal">{children}</ol>,
        li: ({ children }) => (
            <li className="flex items-start gap-2.5 text-slate-700 leading-relaxed text-[1.05rem]">
                <span className={`mt-2 w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />
                <span>{children}</span>
            </li>
        ),
        strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
        em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
        blockquote: ({ children }) => (
            <blockquote className={`border-l-4 ${borderColor} pl-4 py-0.5 my-3 text-slate-600 italic`}>{children}</blockquote>
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
}

/** Blue-accented markdown components (summaries) */
export const summaryMdComponents = createMdComponents('blue');

/** Teal-accented markdown components (chat) */
export const chatMdComponents = createMdComponents('teal');
