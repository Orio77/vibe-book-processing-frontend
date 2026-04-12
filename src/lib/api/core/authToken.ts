const AUTH_TOKEN_STORAGE_KEY = 'bookProcessing.authToken';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    try {
        const base64 = parts[1].replaceAll('-', '+').replaceAll('_', '/');
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        const json = globalThis.atob(padded);
        const parsed = JSON.parse(json) as unknown;
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }
        return parsed as Record<string, unknown>;
    } catch {
        return null;
    }
}

function isJwtExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);
    if (!payload) return false;

    const exp = payload.exp;
    if (typeof exp !== 'number' || !Number.isFinite(exp)) {
        return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return exp <= now;
}

export function getAuthToken(): string | null {
    const token = globalThis.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) return null;
    const normalized = token.trim();
    return normalized.length > 0 ? normalized : null;
}

export function setAuthToken(token: string): void {
    const normalized = token.trim();
    if (normalized.length === 0) {
        globalThis.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        return;
    }
    globalThis.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, normalized);
}

export function clearAuthToken(): void {
    globalThis.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function isAuthenticated(): boolean {
    const token = getAuthToken();
    if (!token) return false;

    if (isJwtExpired(token)) {
        clearAuthToken();
        return false;
    }

    return true;
}

export function extractJwtToken(payload: unknown): string | null {
    if (typeof payload === 'string') {
        const normalized = payload.trim();
        return normalized.length > 0 ? normalized : null;
    }

    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const candidate = payload as {
        token?: unknown;
        jwt?: unknown;
        jwtToken?: unknown;
        bearerToken?: unknown;
        access?: unknown;
        accessToken?: unknown;
        access_token?: unknown;
        data?: unknown;
    };

    const directToken = candidate.token
        ?? candidate.jwt
        ?? candidate.jwtToken
        ?? candidate.bearerToken
        ?? candidate.access
        ?? candidate.accessToken
        ?? candidate.access_token;

    if (typeof directToken === 'string') {
        const normalizedDirectToken = directToken.trim();
        return normalizedDirectToken.length > 0 ? normalizedDirectToken : null;
    }

    if (candidate.data && typeof candidate.data === 'object') {
        return extractJwtToken(candidate.data);
    }

    return null;
}
