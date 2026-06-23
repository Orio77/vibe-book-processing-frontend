const STORAGE_KEY = 'offline-llm-settings:v1';

export interface OfflineLlmSettings {
    apiKey: string;
    baseUrl: string;
    model: string;
}

const DEFAULTS: OfflineLlmSettings = {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
};

export function loadOfflineLlmSettings(): OfflineLlmSettings {
    try {
        const raw = globalThis.localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULTS };
        const parsed = JSON.parse(raw) as Partial<OfflineLlmSettings>;
        return {
            apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : DEFAULTS.apiKey,
            baseUrl: typeof parsed.baseUrl === 'string' && parsed.baseUrl.trim() ? parsed.baseUrl.trim() : DEFAULTS.baseUrl,
            model: typeof parsed.model === 'string' && parsed.model.trim() ? parsed.model.trim() : DEFAULTS.model,
        };
    } catch {
        return { ...DEFAULTS };
    }
}

export function saveOfflineLlmSettings(settings: OfflineLlmSettings): void {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getOfflineLlmDefaults(): OfflineLlmSettings {
    return { ...DEFAULTS };
}
