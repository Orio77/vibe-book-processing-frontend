import { MessageSquare } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';
import { BlankPage, PageSkeleton } from './PagePlaceholders';
import type { Chapter, PDFChatResponse, Sentence } from '@/types';
import type React from 'react';

interface ReaderBookContentProps {
    readonly readerViewMode: boolean;
    readonly page: number;
    readonly pageLoading: boolean;
    readonly sentences: Sentence[];
    readonly activeChapter: Chapter | undefined;
    readonly loadingIdeas: boolean;
    readonly loadingChat: boolean;
    readonly showIdeas: boolean;
    readonly sentenceIdeasMap: Map<number, unknown[]>;
    readonly isMarkingMode: boolean;
    readonly markedSentences: Sentence[];
    readonly sentenceChatIconMap: Map<number, PDFChatResponse[]>;
    readonly sessionMode: 'online' | 'offline';
    readonly showChat: boolean;
    readonly highlightedSentenceIds: Set<number>;
    readonly highlightedChatResponseIdx: string | null;
    readonly handleChatIconClick: (response: PDFChatResponse, sentenceId: number, idx: number) => void;
    readonly handleIdeaClick: (ideas: unknown[]) => void;
    readonly handlePointerDown: (event: React.PointerEvent<HTMLElement>, sentence: Sentence) => void;
    readonly handlePointerMove: (event: React.PointerEvent<HTMLElement>) => void;
    readonly handlePointerUp: (event: React.PointerEvent<HTMLElement>) => void;
    readonly handlePointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
    readonly handlePointerEnter: (sentence: Sentence) => void;
    readonly handleSentenceKeyDown: (event: React.KeyboardEvent<HTMLElement>, sentence: Sentence) => void;
}

const CHAT_ICON_SHADES = [
    'bg-teal-100 text-teal-500 hover:bg-teal-200',
    'bg-teal-200 text-teal-600 hover:bg-teal-300',
    'bg-teal-300 text-teal-700 hover:bg-teal-400',
    'bg-teal-400 text-teal-800 hover:bg-teal-500',
    'bg-teal-500 text-white hover:bg-teal-600',
];

function getChatIconTitle(cr: PDFChatResponse): string {
    if (!cr.query) return 'Explanation — click to highlight, click again to open';
    const truncated = cr.query.length > 60 ? `${cr.query.slice(0, 60)}…` : cr.query;
    return `"${truncated}" — click to highlight, click again to open`;
}

function getSentenceClassName(isMarked: boolean, isChatHighlighted: boolean, isMarkingMode: boolean): string {
    if (isMarked) return 'bg-yellow-200 cursor-pointer';
    if (isChatHighlighted) return 'bg-teal-100';
    if (isMarkingMode) return 'cursor-pointer hover:bg-slate-100';
    return 'hover:bg-blue-50 cursor-text';
}

export function ReaderBookContent({
    readerViewMode,
    page,
    pageLoading,
    sentences,
    activeChapter,
    loadingIdeas,
    loadingChat,
    showIdeas,
    sentenceIdeasMap,
    isMarkingMode,
    markedSentences,
    sentenceChatIconMap,
    sessionMode,
    showChat,
    highlightedSentenceIds,
    highlightedChatResponseIdx,
    handleChatIconClick,
    handleIdeaClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerEnter,
    handleSentenceKeyDown,
}: ReaderBookContentProps) {
    if (pageLoading) return <PageSkeleton page={page} />;
    if (sentences.length === 0) return <BlankPage page={page} />;

    const renderChatIcons = (sentenceId: number, responses: PDFChatResponse[]) => (
        <span className="inline-flex items-center align-middle gap-px ml-0.5 mr-1">
            {responses.map((cr, idx) => {
                const iconKey = `icon_${sentenceId}_${idx}`;
                const isThisHighlighted = highlightedChatResponseIdx === iconKey;
                const shade = CHAT_ICON_SHADES[idx % CHAT_ICON_SHADES.length];
                const stableKey = `${sentenceId}-cr-${cr.contextSentencesIds.join('_')}-${idx}`;
                return (
                    <button
                        key={stableKey}
                        type="button"
                        title={getChatIconTitle(cr)}
                        onClick={() => handleChatIconClick(cr, sentenceId, idx)}
                        className={`inline-flex items-center justify-center w-4 h-4 rounded-full transition-colors cursor-pointer flex-shrink-0 ${isThisHighlighted ? 'ring-2 ring-teal-500 ring-offset-1' : ''} ${shade}`}
                    >
                        <MessageSquare size={9} />
                    </button>
                );
            })}
        </span>
    );

    const renderSentence = (sentence: Sentence) => {
        if (readerViewMode) {
            return (
                <span key={sentence.id} className="inline">
                    {sentence.content}{' '}
                </span>
            );
        }

        const ideasForSentence = sentenceIdeasMap.get(sentence.id);
        const isIdea = showIdeas && ideasForSentence && ideasForSentence.length > 0;
        const isMarked = markedSentences.some((marked) => marked.id === sentence.id);
        const chatIconResponses = sentenceChatIconMap.get(sentence.id);
        const hasChatIcon = !isMarkingMode && !!chatIconResponses && (sessionMode === 'offline' || showChat);
        const isChatHighlighted = highlightedSentenceIds.has(sentence.id);

        const chatIcons = hasChatIcon && chatIconResponses
            ? renderChatIcons(sentence.id, chatIconResponses)
            : null;

        if (isIdea && !isMarkingMode && ideasForSentence) {
            return (
                <span key={sentence.id} className="inline">
                    <button
                        type="button"
                        onClick={() => handleIdeaClick(ideasForSentence)}
                        className={`inline text-left font-inherit text-inherit leading-inherit m-0 p-0 border-0 rounded px-0.5 transition-colors duration-200 cursor-pointer ${isChatHighlighted ? 'bg-teal-200 hover:bg-teal-300' : 'bg-blue-200 hover:bg-blue-300'}`}
                        style={{ font: 'inherit', letterSpacing: 'inherit', wordSpacing: 'inherit' }}
                    >
                        {sentence.content}
                    </button>
                    {chatIcons}{!chatIcons && ' '}
                </span>
            );
        }

        return (
            <span key={sentence.id} className="inline">
                <button
                    type="button"
                    data-sentence-id={sentence.id}
                    className={`inline text-left font-inherit text-inherit leading-inherit m-0 p-0 border-0 transition-colors duration-200 rounded px-0.5 ${getSentenceClassName(isMarked, isChatHighlighted, isMarkingMode)}`}
                    style={{ font: 'inherit', letterSpacing: 'inherit', wordSpacing: 'inherit' }}
                    onPointerDown={(event) => handlePointerDown(event, sentence)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    onPointerEnter={() => handlePointerEnter(sentence)}
                    onKeyDown={(event) => handleSentenceKeyDown(event, sentence)}
                >
                    {sentence.content}
                </button>
                {chatIcons}{!chatIcons && ' '}
            </span>
        );
    };

    const chapterTitleClassName = readerViewMode
        ? 'text-3xl sm:text-4xl font-bold tracking-tight mb-2'
        : 'text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2';

    const chapterDividerClassName = readerViewMode
        ? 'mb-10 pb-6 border-b border-current/20'
        : 'mb-10 pb-6 border-b border-slate-100';

    const contentClassName = readerViewMode
        ? 'space-y-6 font-serif'
        : 'space-y-6 text-slate-800 leading-relaxed font-serif';

    const sentencesWrapperClassName = readerViewMode
        ? 'relative'
        : 'text-lg relative';

    return (
        <div className={contentClassName}>
            {activeChapter?.startPage === page && (
                <div className={chapterDividerClassName}>
                    <h1 className={chapterTitleClassName}>
                        {activeChapter.title}
                    </h1>
                </div>
            )}
            <div className={sentencesWrapperClassName}>
                {loadingIdeas && !readerViewMode && (
                    <div className="absolute top-0 right-0 -mt-6 -mr-4 bg-white/80 p-2 rounded-lg shadow-sm backdrop-blur-sm shadow-blue-100 border border-blue-100 z-10 flex items-center text-sm text-blue-600">
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Loading ideas...
                    </div>
                )}
                {loadingChat && !readerViewMode && (
                    <div className="absolute top-0 right-0 -mt-6 -mr-4 bg-white/80 p-2 rounded-lg shadow-sm backdrop-blur-sm shadow-teal-100 border border-teal-100 z-10 flex items-center text-sm text-teal-600">
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Loading chat responses...
                    </div>
                )}
                {sentences.map((sentence) => renderSentence(sentence))}
            </div>
        </div>
    );
}
