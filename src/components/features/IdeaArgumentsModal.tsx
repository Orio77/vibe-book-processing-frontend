import { useState, useEffect } from 'react';
import { Modal, LoadingSpinner } from '@/components/ui';
import { createIdeaExplanation, fetchIdeaArguments, fetchIdeaExplanations } from '@/lib/api';
import type { IdeaWithSentences, IdeaArgumentDTO, IdeaExplanationDTO } from '@/types';

const EXPLANATION_PREVIEW_LENGTH = 180;

interface IdeaArgumentsModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly ideas: IdeaWithSentences[];
}

export function IdeaArgumentsModal({ isOpen, onClose, ideas }: IdeaArgumentsModalProps) {
    const [argumentsMap, setArgumentsMap] = useState<Record<number, IdeaArgumentDTO[]>>({});
    const [explanationsMap, setExplanationsMap] = useState<Record<number, IdeaExplanationDTO[]>>({});
    const [generatingExplanationByIdeaId, setGeneratingExplanationByIdeaId] = useState<Record<number, boolean>>({});
    const [explanationErrorByIdeaId, setExplanationErrorByIdeaId] = useState<Record<number, string | null>>({});
    const [expandedExplanationIds, setExpandedExplanationIds] = useState<Record<number, boolean>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || ideas.length === 0) return;

        let isMounted = true;
        setLoading(true);

        const fetchAllData = async () => {
            try {
                const payload = await Promise.all(
                    ideas.map(async (ideaObj) => {
                        const ideaId = ideaObj.idea.ideaId;
                        const [argsResult, explanationsResult] = await Promise.allSettled([
                            fetchIdeaArguments(ideaId),
                            fetchIdeaExplanations(ideaId),
                        ]);

                        return {
                            ideaId,
                            args: argsResult.status === 'fulfilled' ? argsResult.value : [],
                            explanations: explanationsResult.status === 'fulfilled' ? explanationsResult.value : [],
                            explanationFetchError: explanationsResult.status === 'rejected'
                                ? 'Could not load explanations for this idea.'
                                : null,
                        };
                    }),
                );

                const newArgs: Record<number, IdeaArgumentDTO[]> = {};
                const newExplanations: Record<number, IdeaExplanationDTO[]> = {};
                const explanationFetchErrors: Record<number, string | null> = {};
                for (const item of payload) {
                    newArgs[item.ideaId] = item.args;
                    newExplanations[item.ideaId] = item.explanations;
                    explanationFetchErrors[item.ideaId] = item.explanationFetchError;
                }

                if (isMounted) {
                    setArgumentsMap(newArgs);
                    setExplanationsMap(newExplanations);
                    setExplanationErrorByIdeaId(explanationFetchErrors);
                    setExpandedExplanationIds({});
                }
            } catch (error) {
                console.error('Failed to fetch idea details', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchAllData();

        return () => {
            isMounted = false;
        };
    }, [isOpen, ideas]);

    const handleGenerateExplanation = async (ideaId: number, ideaTitle: string) => {
        if (generatingExplanationByIdeaId[ideaId]) {
            return;
        }

        setGeneratingExplanationByIdeaId((prev) => ({ ...prev, [ideaId]: true }));
        setExplanationErrorByIdeaId((prev) => ({ ...prev, [ideaId]: null }));

        try {
            const explanation = await createIdeaExplanation(ideaId, ideaTitle);
            setExplanationsMap((prev) => {
                const current = prev[ideaId] || [];
                return { ...prev, [ideaId]: [explanation, ...current] };
            });
        } catch (error) {
            console.error('Failed to generate explanation', error);
            setExplanationErrorByIdeaId((prev) => ({
                ...prev,
                [ideaId]: 'Could not generate explanation right now. Please try again.',
            }));
        } finally {
            setGeneratingExplanationByIdeaId((prev) => ({ ...prev, [ideaId]: false }));
        }
    };

    const toggleExplanationExpanded = (explanationId: number) => {
        setExpandedExplanationIds((prev) => ({
            ...prev,
            [explanationId]: !prev[explanationId],
        }));
    };

    const renderExplanationText = (text: string, isExpanded: boolean) => {
        const normalized = text.trim();
        if (!normalized) {
            return <span className="italic text-slate-500">Empty explanation.</span>;
        }

        if (isExpanded || normalized.length <= EXPLANATION_PREVIEW_LENGTH) {
            return <span>{normalized}</span>;
        }

        return <span>{normalized.slice(0, EXPLANATION_PREVIEW_LENGTH)}…</span>;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Idea Arguments">
            {loading ? (
                <div className="py-8"><LoadingSpinner /></div>
            ) : (
                <div className="space-y-6">
                    {ideas.map((ideaObj) => {
                        const ideaId = ideaObj.idea.ideaId;
                        const args = argumentsMap[ideaId] || [];
                        const explanations = explanationsMap[ideaId] || [];
                        const generatingExplanation = generatingExplanationByIdeaId[ideaId] || false;
                        const explanationError = explanationErrorByIdeaId[ideaId];

                        return (
                            <div key={ideaId} className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-4">
                                <h4 className="text-md font-semibold text-slate-800 mb-3 flex items-start">
                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded mr-2 mt-0.5 shrink-0">Idea</span>
                                    {ideaObj.idea.ideaTitle}
                                </h4>

                                {args.length > 0 ? (
                                    <>
                                        <h5 className="text-sm font-semibold text-slate-700">Arguments</h5>
                                        <ul className="space-y-2 pl-2">
                                            {args.map((arg) => (
                                                <li key={arg.id} className="text-sm text-slate-700 flex gap-2">
                                                    <span className="text-blue-500 mt-1">•</span>
                                                    <span>{arg.text}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-500 italic pl-2">No arguments found for this idea.</p>
                                )}

                                <div className="flex items-center justify-between gap-3">
                                    <h5 className="text-sm font-semibold text-slate-700">Explanations</h5>
                                    <button
                                        type="button"
                                        onClick={() => handleGenerateExplanation(ideaId, ideaObj.idea.ideaTitle)}
                                        disabled={generatingExplanation}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {generatingExplanation ? 'Generating...' : 'Generate Explanation'}
                                    </button>
                                </div>

                                {explanationError && (
                                    <p className="text-sm text-red-600">{explanationError}</p>
                                )}

                                {explanations.length > 0 ? (
                                    <ul className="space-y-2 pl-2">
                                        {explanations.map((explanation) => {
                                            const explanationText = explanation.text ?? '';
                                            const isLong = explanationText.trim().length > EXPLANATION_PREVIEW_LENGTH;
                                            const isExpanded = !!expandedExplanationIds[explanation.id];

                                            return (
                                                <li key={explanation.id} className="text-sm text-slate-700 flex gap-2">
                                                    <span className="text-blue-500 mt-1">•</span>
                                                    <div className="min-w-0 flex-1 space-y-1">
                                                        <p className="break-words">
                                                            {renderExplanationText(explanationText, isExpanded)}
                                                        </p>
                                                        {isLong && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleExplanationExpanded(explanation.id)}
                                                                className="text-xs font-medium text-blue-700 hover:text-blue-800 underline underline-offset-2"
                                                                aria-expanded={isExpanded}
                                                            >
                                                                {isExpanded ? 'Collapse' : 'Expand'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 italic pl-2">No explanations found for this idea.</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
}