import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageSquare, HelpCircle, Pencil, Trash2, Check, X } from 'lucide-react';
import { Modal, LoadingSpinner } from '@/components/ui';
import type { PDFChatResponse } from '@/types';

// ---------------------------------------------------------------------------
// react-markdown component overrides (same style as SummaryViewer)
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
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
            <span>{children}</span>
        </li>
    ),
    strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
    em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
    blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-teal-200 pl-4 py-0.5 my-3 text-slate-600 italic">{children}</blockquote>
    ),
    code: ({ children }) => (
        <code className="bg-slate-100 text-slate-800 rounded px-1.5 py-0.5 text-[0.9em] font-mono">{children}</code>
    ),
    pre: ({ children }) => (
        <pre className="bg-slate-100 rounded-xl px-4 py-3 overflow-x-auto text-sm font-mono mb-4">{children}</pre>
    ),
    hr: () => <hr className="border-slate-200 my-6" />,
};

// ---------------------------------------------------------------------------
// ChatResponseModal
// ---------------------------------------------------------------------------

interface ChatResponseModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly chatResponse: PDFChatResponse | null;
    readonly onDelete?: (id: number) => Promise<void>;
    readonly onSave?: (id: number, newText: string) => Promise<void>;
}

export function ChatResponseModal({
    isOpen,
    onClose,
    chatResponse,
    onDelete,
    onSave,
}: ChatResponseModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const hasValidChatResponseId =
        typeof chatResponse?.chatResponseId === 'number' && Number.isFinite(chatResponse.chatResponseId);

    // Reset edit state whenever the modal opens with a new response
    useEffect(() => {
        if (isOpen && chatResponse) {
            setIsEditing(false);
            setEditText(chatResponse.chatResponse);
            setConfirmDelete(false);
        }
    }, [isOpen, chatResponse]);

    const handleStartEdit = () => {
        if (!chatResponse || !hasValidChatResponseId) {
            console.warn('Cannot edit chat response without a valid chatResponseId:', chatResponse);
            return;
        }
        setEditText(chatResponse.chatResponse);
        setConfirmDelete(false);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!chatResponse || !onSave) return;
        if (!hasValidChatResponseId) {
            console.error('Invalid chat response payload for save:', chatResponse);
            return;
        }
        setIsSaving(true);
        try {
            await onSave(chatResponse.chatResponseId, editText);
            setIsEditing(false);
        } catch (_error) {
            console.error('Failed to save chat response:', _error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = () => {
        if (!hasValidChatResponseId) {
            console.warn('Cannot delete chat response without a valid chatResponseId:', chatResponse);
            return;
        }
        setIsEditing(false);
        setConfirmDelete(true);
    };

    const handleConfirmDelete = async () => {
        if (!chatResponse || !onDelete) return;
        if (!hasValidChatResponseId) {
            console.error('Invalid chat response payload for delete:', chatResponse);
            return;
        }
        setIsDeleting(true);
        try {
            await onDelete(chatResponse.chatResponseId);
            onClose();
        } catch (_error) {
            console.error('Failed to delete chat response:', _error);
        } finally {
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

    const handleCancelDelete = () => {
        setConfirmDelete(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                if (isSaving || isDeleting) return;
                if (isEditing) { setIsEditing(false); return; }
                onClose();
            }}
            title="Chat Response"
        >
            {chatResponse && (
                <div className="space-y-5">
                    {/* Prompt / query */}
                    {chatResponse.query && (
                        <div className="flex items-start gap-3 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
                            <HelpCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">
                                    Prompt
                                </p>
                                <p className="text-sm text-teal-900 leading-relaxed">
                                    {chatResponse.query}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── LLM response — view or edit mode ── */}
                    {isEditing ? (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Editing response — markdown supported
                            </p>
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full min-h-[260px] resize-y p-3 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent custom-scrollbar text-slate-800 leading-relaxed"
                                autoFocus
                                spellCheck={false}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <X size={14} /> Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving || editText.trim() === ''}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <LoadingSpinner size="sm" />
                                    ) : (
                                        <Check size={14} />
                                    )}
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3">
                            <MessageSquare className="w-4 h-4 text-teal-600 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0 prose prose-slate prose-sm max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={mdComponents}
                                >
                                    {chatResponse.chatResponse}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {/* ── Delete confirmation banner ── */}
                    {confirmDelete && (
                        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                            <p className="text-sm text-red-700 font-medium">
                                Delete this response permanently?
                            </p>
                            <div className="flex gap-2 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={handleCancelDelete}
                                    disabled={isDeleting}
                                    className="px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? <LoadingSpinner size="sm" /> : <Trash2 size={14} />}
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Action buttons (shown when not editing / not in confirm) ── */}
                    {!isEditing && !confirmDelete && (onSave || onDelete) && (
                        <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                            {onSave && hasValidChatResponseId && (
                                <button
                                    type="button"
                                    onClick={handleStartEdit}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                                >
                                    <Pencil size={14} /> Edit
                                </button>
                            )}
                            {onDelete && hasValidChatResponseId && (
                                <button
                                    type="button"
                                    onClick={handleDeleteClick}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            )}
                            {!hasValidChatResponseId && (
                                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                                    This response can be viewed, but not edited or deleted because it has no backend ID.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
