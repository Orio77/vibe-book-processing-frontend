import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReaderViewScrollMode, ReaderViewSettings, ReaderViewTextWidth, ReaderViewTheme } from '@/types';

const DEFAULT_READER_VIEW_SETTINGS: ReaderViewSettings = {
    fontSize: 20,
    lineHeight: 1.8,
    textWidth: 'medium',
    theme: 'light',
    scrollMode: 'vertical',
    pageFlipEnabled: true,
};

const FONT_SIZE_MIN = 14;
const FONT_SIZE_MAX = 34;
const LINE_HEIGHT_MIN = 1.2;
const LINE_HEIGHT_MAX = 2.4;

function normalizeTheme(value: unknown): ReaderViewTheme {
    return value === 'sepia' || value === 'dark' ? value : 'light';
}

function normalizeTextWidth(value: unknown): ReaderViewTextWidth {
    return value === 'narrow' || value === 'wide' ? value : 'medium';
}

function normalizeScrollMode(value: unknown): ReaderViewScrollMode {
    return value === 'horizontal' ? 'horizontal' : 'vertical';
}

function normalizeNumber(value: unknown, fallback: number, min: number, max: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, value));
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

function sanitizeSettings(raw: unknown): ReaderViewSettings {
    if (!raw || typeof raw !== 'object') {
        return DEFAULT_READER_VIEW_SETTINGS;
    }

    const payload = raw as Partial<ReaderViewSettings>;

    return {
        fontSize: normalizeNumber(payload.fontSize, DEFAULT_READER_VIEW_SETTINGS.fontSize, FONT_SIZE_MIN, FONT_SIZE_MAX),
        lineHeight: normalizeNumber(payload.lineHeight, DEFAULT_READER_VIEW_SETTINGS.lineHeight, LINE_HEIGHT_MIN, LINE_HEIGHT_MAX),
        textWidth: normalizeTextWidth(payload.textWidth),
        theme: normalizeTheme(payload.theme),
        scrollMode: normalizeScrollMode(payload.scrollMode),
        pageFlipEnabled: normalizeBoolean(payload.pageFlipEnabled, DEFAULT_READER_VIEW_SETTINGS.pageFlipEnabled),
    };
}

export function useReaderViewSettings(pdfId: number | string | null | undefined) {
    const [settings, setSettings] = useState<ReaderViewSettings>(DEFAULT_READER_VIEW_SETTINGS);

    const storageKey = useMemo(() => {
        if (pdfId === null || pdfId === undefined || pdfId === '') {
            return null;
        }
        return `reader-view-settings:${String(pdfId)}`;
    }, [pdfId]);

    useEffect(() => {
        if (!storageKey) {
            setSettings(DEFAULT_READER_VIEW_SETTINGS);
            return;
        }

        try {
            const raw = globalThis.localStorage.getItem(storageKey);
            if (!raw) {
                setSettings(DEFAULT_READER_VIEW_SETTINGS);
                return;
            }
            const parsed = JSON.parse(raw) as unknown;
            setSettings(sanitizeSettings(parsed));
        } catch {
            setSettings(DEFAULT_READER_VIEW_SETTINGS);
        }
    }, [storageKey]);

    const updateSettings = useCallback((patch: Partial<ReaderViewSettings>) => {
        setSettings((prev) => {
            const next = sanitizeSettings({ ...prev, ...patch });

            if (storageKey) {
                try {
                    globalThis.localStorage.setItem(storageKey, JSON.stringify(next));
                } catch {
                    // No-op for storage failures.
                }
            }

            return next;
        });
    }, [storageKey]);

    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_READER_VIEW_SETTINGS);
        if (storageKey) {
            try {
                globalThis.localStorage.setItem(storageKey, JSON.stringify(DEFAULT_READER_VIEW_SETTINGS));
            } catch {
                // No-op for storage failures.
            }
        }
    }, [storageKey]);

    return {
        settings,
        updateSettings,
        resetSettings,
        defaultSettings: DEFAULT_READER_VIEW_SETTINGS,
    };
}
