import { useState, useEffect } from 'react';
import { Modal, LoadingSpinner } from '@/components/ui';
import { fetchIdeaArguments } from '@/lib/api';
import type { IdeaWithSentences, IdeaArgumentDTO } from '@/types';

interface IdeaArgumentsModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly ideas: IdeaWithSentences[];
}

export function IdeaArgumentsModal({ isOpen, onClose, ideas }: IdeaArgumentsModalProps) {
    const [argumentsMap, setArgumentsMap] = useState<Record<number, IdeaArgumentDTO[]>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || ideas.length === 0) return;

        let isMounted = true;
        setLoading(true);

        const fetchAllArgs = async () => {
            try {
                const newArgs: Record<number, IdeaArgumentDTO[]> = {};
                for (const ideaObj of ideas) {
                    const args = await fetchIdeaArguments(ideaObj.idea.ideaId);
                    newArgs[ideaObj.idea.ideaId] = args;
                }
                if (isMounted) {
                    setArgumentsMap(newArgs);
                }
            } catch (error) {
                console.error("Failed to fetch arguments", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchAllArgs();

        return () => {
            isMounted = false;
        };
    }, [isOpen, ideas]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Idea Arguments">
            {loading ? (
                <div className="py-8"><LoadingSpinner /></div>
            ) : (
                <div className="space-y-6">
                    {ideas.map((ideaObj) => {
                        const args = argumentsMap[ideaObj.idea.ideaId] || [];
                        return (
                            <div key={ideaObj.idea.ideaId} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <h4 className="text-md font-semibold text-slate-800 mb-3 flex items-start">
                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded mr-2 mt-0.5 shrink-0">Idea</span>
                                    {ideaObj.idea.ideaTitle}
                                </h4>
                                {args.length > 0 ? (
                                    <ul className="space-y-2 pl-2">
                                        {args.map((arg) => (
                                            <li key={arg.id} className="text-sm text-slate-700 flex gap-2">
                                                <span className="text-blue-500 mt-1">•</span>
                                                <span>{arg.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 italic pl-2">No arguments found for this idea.</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
}