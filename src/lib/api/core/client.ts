import axios from 'axios';
import { clearAuthToken, getAuthToken } from './authToken';

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

export function resolveApiRootBaseUrl(): string | undefined {
    const configured = import.meta.env.VITE_API_BASE_URL;
    if (!configured) return undefined;
    return configured.replace(/\/api\/pdf\/?$/, '');
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

            if (globalThis.location !== undefined) {
                const isAuthRoute = globalThis.location.pathname.startsWith('/auth/');
                if (!isAuthRoute) {
                    globalThis.location.assign('/auth/login');
                }
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;
