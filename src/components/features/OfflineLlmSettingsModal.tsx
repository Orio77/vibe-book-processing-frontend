import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui';
import {
    loadOfflineLlmSettings,
    saveOfflineLlmSettings,
    getOfflineLlmDefaults,
    type OfflineLlmSettings,
} from '@/lib/llm/settings';

interface OfflineLlmSettingsModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
}

export function OfflineLlmSettingsModal({ isOpen, onClose }: OfflineLlmSettingsModalProps) {
    const [draft, setDraft] = useState<OfflineLlmSettings>(() => getOfflineLlmDefaults());

    useEffect(() => {
        if (isOpen) {
            setDraft(loadOfflineLlmSettings());
        }
    }, [isOpen]);

    const handleSave = () => {
        saveOfflineLlmSettings(draft);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Offline LLM (API key)">
            <p className="text-sm text-slate-600 mb-4">
                Explain and chat in offline packs call an OpenAI-compatible API from your browser. Many providers block
                cross-origin requests; if requests fail, use a small local proxy or a desktop wrapper.
            </p>
            <div className="space-y-3">
                <label className="block">
                    <span className="text-sm font-medium text-slate-700">API key</span>
                    <input
                        type="password"
                        autoComplete="off"
                        value={draft.apiKey}
                        onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="sk-…"
                    />
                </label>
                <label className="block">
                    <span className="text-sm font-medium text-slate-700">Base URL</span>
                    <input
                        type="url"
                        value={draft.baseUrl}
                        onChange={(e) => setDraft((d) => ({ ...d, baseUrl: e.target.value.trim() }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="https://api.openai.com/v1"
                    />
                </label>
                <label className="block">
                    <span className="text-sm font-medium text-slate-700">Model</span>
                    <input
                        type="text"
                        value={draft.model}
                        onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value.trim() }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="gpt-4o-mini"
                    />
                </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    className="px-3 py-1.5 rounded-lg text-sm bg-slate-900 text-white hover:bg-slate-800"
                >
                    Save
                </button>
            </div>
        </Modal>
    );
}
