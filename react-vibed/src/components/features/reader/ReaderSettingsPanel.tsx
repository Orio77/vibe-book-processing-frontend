import type { ReaderViewSettings } from '@/types';

interface ReaderSettingsPanelProps {
    readonly settings: ReaderViewSettings;
    readonly onUpdateSettings: (patch: Partial<ReaderViewSettings>) => void;
    readonly onResetSettings: () => void;
    readonly onDone: () => void;
}

export function ReaderSettingsPanel({
    settings,
    onUpdateSettings,
    onResetSettings,
    onDone,
}: ReaderSettingsPanelProps) {
    return (
        <div className="space-y-5">
            <div>
                <label htmlFor="reader-font-size" className="block text-sm font-medium text-slate-700 mb-2">
                    Font size ({settings.fontSize}px)
                </label>
                <input
                    id="reader-font-size"
                    type="range"
                    min={14}
                    max={34}
                    step={1}
                    value={settings.fontSize}
                    onChange={(event) => onUpdateSettings({ fontSize: Number(event.target.value) })}
                    className="w-full"
                />
            </div>

            <div>
                <label htmlFor="reader-line-height" className="block text-sm font-medium text-slate-700 mb-2">
                    Line spacing ({settings.lineHeight.toFixed(1)})
                </label>
                <input
                    id="reader-line-height"
                    type="range"
                    min={1.2}
                    max={2.4}
                    step={0.1}
                    value={settings.lineHeight}
                    onChange={(event) => onUpdateSettings({ lineHeight: Number(event.target.value) })}
                    className="w-full"
                />
            </div>

            <div>
                <span className="block text-sm font-medium text-slate-700 mb-2">Text width</span>
                <div className="flex gap-2">
                    {[
                        { key: 'narrow', label: 'Narrow' },
                        { key: 'medium', label: 'Medium' },
                        { key: 'wide', label: 'Wide' },
                    ].map((option) => (
                        <button
                            key={option.key}
                            type="button"
                            onClick={() => onUpdateSettings({ textWidth: option.key as 'narrow' | 'medium' | 'wide' })}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${settings.textWidth === option.key
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <span className="block text-sm font-medium text-slate-700 mb-2">Theme</span>
                <div className="flex gap-2">
                    {[
                        { key: 'light', label: 'Light' },
                        { key: 'sepia', label: 'Sepia' },
                        { key: 'dark', label: 'Dark' },
                    ].map((option) => (
                        <button
                            key={option.key}
                            type="button"
                            onClick={() => onUpdateSettings({ theme: option.key as 'light' | 'sepia' | 'dark' })}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${settings.theme === option.key
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <span className="block text-sm font-medium text-slate-700 mb-2">Scrolling</span>
                <div className="flex gap-2">
                    {[
                        { key: 'vertical', label: 'Vertical' },
                        { key: 'horizontal', label: 'Horizontal' },
                    ].map((option) => (
                        <button
                            key={option.key}
                            type="button"
                            onClick={() => onUpdateSettings({ scrollMode: option.key as 'vertical' | 'horizontal' })}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${settings.scrollMode === option.key
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <span className="block text-sm font-medium text-slate-700 mb-2">Page flipping</span>
                <button
                    type="button"
                    onClick={() => onUpdateSettings({ pageFlipEnabled: !settings.pageFlipEnabled })}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${settings.pageFlipEnabled
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    {settings.pageFlipEnabled ? 'Enabled' : 'Disabled'}
                </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <button
                    type="button"
                    onClick={onResetSettings}
                    className="text-sm text-slate-600 hover:text-slate-800"
                >
                    Reset to defaults
                </button>
                <button
                    type="button"
                    onClick={onDone}
                    className="px-3 py-1.5 rounded-lg text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                    Done
                </button>
            </div>
        </div>
    );
}
