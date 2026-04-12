import axios from 'axios';

export function coerceNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

/**
 * Many backend endpoints return 204 No Content for empty collections.
 * This helper normalises that to an empty array.
 */
export function emptyOn204<T>(response: { status: number; data: T }): T | [] {
    return response.status === 204 ? [] : response.data;
}

export function unwrapArrayPayload<T>(payload: unknown, nestedKeys: ReadonlyArray<string>): T[] {
    if (Array.isArray(payload)) {
        return payload as T[];
    }

    if (!payload || typeof payload !== 'object') {
        return [];
    }

    for (const key of nestedKeys) {
        const candidate = (payload as Record<string, unknown>)[key];
        if (Array.isArray(candidate)) {
            return candidate as T[];
        }
    }

    return [];
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const payload = error.response?.data;

        let serverMessage: string | null = null;

        if (typeof payload === 'string' && payload.trim().length > 0) {
            serverMessage = payload.trim();
        } else if (payload && typeof payload === 'object') {
            const candidate = (payload as { message?: unknown; error?: unknown; detail?: unknown });
            if (typeof candidate.message === 'string' && candidate.message.trim().length > 0) {
                serverMessage = candidate.message.trim();
            } else if (typeof candidate.error === 'string' && candidate.error.trim().length > 0) {
                serverMessage = candidate.error.trim();
            } else if (typeof candidate.detail === 'string' && candidate.detail.trim().length > 0) {
                serverMessage = candidate.detail.trim();
            }
        }

        if (serverMessage) {
            return status ? `${serverMessage} (HTTP ${status})` : serverMessage;
        }

        if (status) {
            return `${fallbackMessage} (HTTP ${status})`;
        }

        return error.message || fallbackMessage;
    }

    if (error instanceof Error && error.message.trim().length > 0) {
        return `${fallbackMessage}: ${error.message}`;
    }

    return fallbackMessage;
}
