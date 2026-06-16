const SETTINGS_STORAGE_KEY = 'bookProcessing.settings';

export type TextWidth = 'narrow' | 'medium' | 'wide';
export type ScrollMode = 'vertical' | 'horizontal';

export interface SettingsData {
    fontSize: number;
    lineSpacing: number;
    textWidth: TextWidth;
    scrollMode: ScrollMode;
    pageFlipping: boolean;
    theme: string;
}

const DEFAULTS: SettingsData = {
    fontSize: 20,
    lineSpacing: 1.8,
    textWidth: 'medium',
    scrollMode: 'vertical',
    pageFlipping: true,
    theme: 'default',
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
    fontSize = $state(DEFAULTS.fontSize);
    lineSpacing = $state(DEFAULTS.lineSpacing);
    textWidth = $state<TextWidth>(DEFAULTS.textWidth);
    scrollMode = $state<ScrollMode>(DEFAULTS.scrollMode);
    pageFlipping = $state(DEFAULTS.pageFlipping);
    theme = $state(DEFAULTS.theme);

    constructor() {
        const saved = loadFromStorage();
        this.fontSize = saved.fontSize;
        this.lineSpacing = saved.lineSpacing;
        this.textWidth = saved.textWidth;
        this.scrollMode = saved.scrollMode;
        this.pageFlipping = saved.pageFlipping;
        this.theme = saved.theme;

        // Apply theme on load
        this.applyTheme();
    }

    private persist() {
        saveToStorage({
            fontSize: this.fontSize,
            lineSpacing: this.lineSpacing,
            textWidth: this.textWidth,
            scrollMode: this.scrollMode,
            pageFlipping: this.pageFlipping,
            theme: this.theme,
        });
    }

    private applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
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

    resetToDefaults() {
        this.fontSize = DEFAULTS.fontSize;
        this.lineSpacing = DEFAULTS.lineSpacing;
        this.textWidth = DEFAULTS.textWidth;
        this.scrollMode = DEFAULTS.scrollMode;
        this.pageFlipping = DEFAULTS.pageFlipping;
        this.theme = DEFAULTS.theme;
        this.applyTheme();
        this.persist();
    }
}

export const settingsStore = new SettingsStore();
