import axios from 'axios';
import { clearAuthToken, getAuthToken } from './authToken';
import { authStore } from '$lib/stores/auth.svelte';

/**
 * Configured Axios instance.
 * Base URL is read from VITE_API_BASE_URL env variable.
 */
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        Accept: 'application/json',
    },
});

const API_SUFFIX_REGEX = /\/api(?:\/pdf)?$/;
const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//;

function getBaseOriginForParsing(): string {
    if (typeof globalThis.location !== 'undefined') {
        return globalThis.location.origin;
    }
    return 'http://localhost';
}

function trimTrailingSlashes(path: string): string {
    return path.replace(/\/+$/, '');
}

function removeApiSuffix(path: string): string {
    const normalized = trimTrailingSlashes(path);
    return normalized.replace(API_SUFFIX_REGEX, '');
}

function isAbsoluteUrl(value: string): boolean {
    return ABSOLUTE_URL_REGEX.test(value);
}

export function resolveApiRootBaseUrl(): string | undefined {
    const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
    if (!configured) return undefined;

    const absolute = isAbsoluteUrl(configured);
    const parsed = new URL(configured, getBaseOriginForParsing());
    const rootPath = removeApiSuffix(parsed.pathname);

    if (!absolute) {
        return rootPath || '/';
    }

    return `${parsed.origin}${rootPath}`;
}

export function resolveWsEndpoint(): string {
    const root = resolveApiRootBaseUrl();
    if (!root) {
        return '/ws';
    }

    const normalizedRoot = trimTrailingSlashes(root);
    return `${normalizedRoot}/ws`;
}

apiClient.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (!token) {
        return config;
    }

    if (config.headers && typeof (config.headers as { set?: unknown }).set === 'function') {
        (config.headers as { set: (name: string, value: string) => void })
            .set('Authorization', `Bearer ${token}`);
    } else {
        config.headers = {
            ...(config.headers as Record<string, string> | undefined),
            Authorization: `Bearer ${token}`,
        } as typeof config.headers;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            clearAuthToken();
            authStore.refresh();

            // if (globalThis.location !== undefined) {
            //     const isAuthRoute = globalThis.location.pathname.startsWith('/auth/');
            //     if (!isAuthRoute) {
            //         globalThis.location.assign('/auth/login');
            //     }
            // }
        }

        return Promise.reject(error);
    },
);

export default apiClient;
