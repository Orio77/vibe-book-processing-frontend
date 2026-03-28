/** Application-wide constants */

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const DEFAULT_PAGE = 1;

export const TOAST_DURATION_MS = 3000;

export const ROUTES = {
    HOME: '/',
    UPLOAD: '/upload',
    READ: '/read/:id',
    /** Must be registered before READ so "offline" is not captured as :id */
    READ_OFFLINE: '/read/offline',
    /** Deep link to a saved IndexedDB pack */
    READ_OFFLINE_EXPORT: '/read/offline/:exportId',
    readById: (id: number | string) => `/read/${id}`,
    readOfflineByExportId: (exportId: string) => `/read/offline/${encodeURIComponent(exportId)}`,
} as const;
