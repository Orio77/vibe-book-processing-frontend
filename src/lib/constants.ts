/** Application-wide constants */

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const DEFAULT_PAGE = 1;

export const TOAST_DURATION_MS = 3000;

export const ROUTES = {
    HOME: '/',
    UPLOAD: '/upload',
    READ: '/read/:id',
    readById: (id: number | string) => `/read/${id}`,
} as const;
