import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { OfflineBookRecord } from '@/types/offlineLibrary';

const DB_NAME = 'book-offline-library';
const DB_VERSION = 1;
const STORE = 'books';

interface OfflineLibraryDB extends DBSchema {
    books: {
        key: string;
        value: OfflineBookRecord;
    };
}

let dbPromise: Promise<IDBPDatabase<OfflineLibraryDB>> | null = null;

function getDb(): Promise<IDBPDatabase<OfflineLibraryDB>> {
    if (!dbPromise) {
        dbPromise = openDB<OfflineLibraryDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE)) {
                    db.createObjectStore(STORE, { keyPath: 'exportId' });
                }
            },
        });
    }
    return dbPromise;
}

export async function getOfflineBookRecord(exportId: string): Promise<OfflineBookRecord | undefined> {
    const db = await getDb();
    return db.get(STORE, exportId);
}

export async function putOfflineBookRecord(record: OfflineBookRecord): Promise<void> {
    const db = await getDb();
    await db.put(STORE, {
        ...record,
        updatedAt: record.updatedAt || new Date().toISOString(),
    });
}

export async function deleteOfflineBookRecord(exportId: string): Promise<void> {
    const db = await getDb();
    await db.delete(STORE, exportId);
}

/** Newest first by `updatedAt`. */
export async function listOfflineBookRecordsSorted(): Promise<OfflineBookRecord[]> {
    const db = await getDb();
    const all = await db.getAll(STORE);
    return all.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}
