const SETTINGS_STORAGE_KEY = 'bookProcessing.settings';
import { saveOfflineLlmSettings } from '$lib/llm/settings';

export type TextWidth = 'narrow' | 'medium' | 'wide';
export type ScrollMode = 'vertical' | 'horizontal';
export type FontFamily = 'default' | 'literata' | 'verdana' | 'helvetica' | 'opendyslexic';

export function getFontFamilyString(font: FontFamily): string {
    switch (font) {
        case 'literata': return "'Literata', serif";
        case 'verdana': return "'Verdana', sans-serif";
        case 'helvetica': return "'Helvetica', 'Arial', sans-serif";
        case 'opendyslexic': return "'OpenDyslexic', sans-serif";
        default: return "inherit";
    }
}

export interface SettingsData {
    fontFamily: FontFamily;
    fontSize: number;
    lineSpacing: number;
    textWidth: TextWidth;
    scrollMode: ScrollMode;
    pageFlipping: boolean;
    theme: string;
    llmApiKey: string;
    llmBaseUrl: string;
    llmModel: string;
    forceOfflineLlm: boolean;
}

const DEFAULTS: SettingsData = {
    fontFamily: 'default',
    fontSize: 20,
    lineSpacing: 1.8,
    textWidth: 'medium',
    scrollMode: 'vertical',
    pageFlipping: true,
    theme: 'light',
    llmApiKey: '',
    llmBaseUrl: 'https://api.openai.com/v1',
    llmModel: 'gpt-4o-mini',
    forceOfflineLlm: false,
};

function loadFromStorage(): SettingsData {
    try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) return { ...DEFAULTS };
        const parsed = JSON.parse(raw) as Partial<SettingsData>;
        return { ...DEFAULTS, ...parsed };
    } catch {
        return { ...DEFAULTS };
    }
}

function saveToStorage(data: SettingsData): void {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
}

class SettingsStore {
    fontFamily = $state<FontFamily>(DEFAULTS.fontFamily);
    fontSize = $state(DEFAULTS.fontSize);
    lineSpacing = $state(DEFAULTS.lineSpacing);
    textWidth = $state<TextWidth>(DEFAULTS.textWidth);
    scrollMode = $state<ScrollMode>(DEFAULTS.scrollMode);
    pageFlipping = $state(DEFAULTS.pageFlipping);
    theme = $state(DEFAULTS.theme);
    llmApiKey = $state(DEFAULTS.llmApiKey);
    llmBaseUrl = $state(DEFAULTS.llmBaseUrl);
    llmModel = $state(DEFAULTS.llmModel);
    forceOfflineLlm = $state(DEFAULTS.forceOfflineLlm);
    private isInitialLoad = true;

    constructor() {
        const saved = loadFromStorage();
        this.fontFamily = saved.fontFamily;
        this.fontSize = saved.fontSize;
        this.lineSpacing = saved.lineSpacing;
        this.textWidth = saved.textWidth;
        this.scrollMode = saved.scrollMode;
        this.pageFlipping = saved.pageFlipping;
        this.theme = saved.theme;
        this.llmApiKey = saved.llmApiKey ?? DEFAULTS.llmApiKey;
        this.llmBaseUrl = saved.llmBaseUrl ?? DEFAULTS.llmBaseUrl;
        this.llmModel = saved.llmModel ?? DEFAULTS.llmModel;
        this.forceOfflineLlm = saved.forceOfflineLlm ?? DEFAULTS.forceOfflineLlm;

        // Apply theme on load
        this.applyTheme();
        this.isInitialLoad = false;
    }

    private persist() {
        saveToStorage({
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            lineSpacing: this.lineSpacing,
            textWidth: this.textWidth,
            scrollMode: this.scrollMode,
            pageFlipping: this.pageFlipping,
            theme: this.theme,
            llmApiKey: this.llmApiKey,
            llmBaseUrl: this.llmBaseUrl,
            llmModel: this.llmModel,
            forceOfflineLlm: this.forceOfflineLlm,
        });
        saveOfflineLlmSettings({
            apiKey: this.llmApiKey,
            baseUrl: this.llmBaseUrl,
            model: this.llmModel,
        });
    }

    private applyTheme() {
        if (typeof document !== 'undefined') {
            const doc = document as any;
            if (!this.isInitialLoad && typeof doc.startViewTransition === 'function') {
                doc.startViewTransition(() => {
                    document.documentElement.setAttribute('data-theme', this.theme);
                });
            } else {
                document.documentElement.setAttribute('data-theme', this.theme);
            }
        }
    }

    setFontFamily(value: FontFamily) {
        this.fontFamily = value;
        this.persist();
    }

    setFontSize(value: number) {
        this.fontSize = Math.max(12, Math.min(32, value));
        this.persist();
    }

    setLineSpacing(value: number) {
        this.lineSpacing = Math.max(1.0, Math.min(3.0, Math.round(value * 10) / 10));
        this.persist();
    }

    setTextWidth(value: TextWidth) {
        this.textWidth = value;
        this.persist();
    }

    setScrollMode(value: ScrollMode) {
        this.scrollMode = value;
        this.persist();
    }

    setPageFlipping(value: boolean) {
        this.pageFlipping = value;
        this.persist();
    }

    setTheme(value: string) {
        this.theme = value;
        this.applyTheme();
        this.persist();
    }

    setLlmApiKey(value: string) {
        this.llmApiKey = value;
        this.persist();
    }

    setLlmBaseUrl(value: string) {
        this.llmBaseUrl = value;
        this.persist();
    }

    setLlmModel(value: string) {
        this.llmModel = value;
        this.persist();
    }

    setForceOfflineLlm(value: boolean) {
        this.forceOfflineLlm = value;
        this.persist();
    }

    resetToDefaults() {
        this.fontFamily = DEFAULTS.fontFamily;
        this.fontSize = DEFAULTS.fontSize;
        this.lineSpacing = DEFAULTS.lineSpacing;
        this.textWidth = DEFAULTS.textWidth;
        this.scrollMode = DEFAULTS.scrollMode;
        this.pageFlipping = DEFAULTS.pageFlipping;
        this.theme = DEFAULTS.theme;
        this.llmApiKey = DEFAULTS.llmApiKey;
        this.llmBaseUrl = DEFAULTS.llmBaseUrl;
        this.llmModel = DEFAULTS.llmModel;
        this.forceOfflineLlm = DEFAULTS.forceOfflineLlm;
        this.applyTheme();
        this.persist();
    }
}

export const settingsStore = new SettingsStore();
