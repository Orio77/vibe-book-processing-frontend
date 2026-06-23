import { describe, it, expect, vi, beforeAll } from 'vitest';

beforeAll(() => {
    globalThis.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
    } as any;
});

import apiClient from '$lib/api/core/client';

describe('API Connection Test', () => {
    it('should reach the backend API server', async () => {
        try {
            const response = await apiClient.get('/get/all');
            
            expect(response.status).toBeGreaterThanOrEqual(200);
            expect(response.status).toBeLessThan(300);
        } catch (error: any) {
            if (error.response) {
                expect(error.response.status).toBeTypeOf('number');
            } else {
                // network error
                throw new Error(`Failed to reach backend: ${error.message}`);
            }
        }
    });
});
