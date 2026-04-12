import apiClient, { resolveApiRootBaseUrl } from '../core/client';
import {
    extractJwtToken,
    setAuthToken,
} from '../core/authToken';

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export async function registerUser(request: RegisterRequest): Promise<string | null> {
    const res = await apiClient.post<unknown>('/auth/register', request, {
        baseURL: resolveApiRootBaseUrl(),
    });

    const token = extractJwtToken(res.data);

    if (token) {
        setAuthToken(token);
    }

    return token;
}

export async function loginUser(request: LoginRequest): Promise<string> {
    const res = await apiClient.post<unknown>('/auth/login', request, {
        baseURL: resolveApiRootBaseUrl(),
    });

    const token = extractJwtToken(res.data);
    if (!token) {
        throw new TypeError('JWT token is missing in login response payload');
    }

    setAuthToken(token);
    return token;
}

export { clearAuthToken, getAuthToken, isAuthenticated, setAuthToken } from '../core/authToken';
