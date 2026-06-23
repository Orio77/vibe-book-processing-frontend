import { zipSync, strToU8 } from 'fflate';
import type { OfflineBookRecord } from '$lib/types/offlineLibrary';

/** Build a study-pack ZIP from a library record (no API calls). */
export function exportOfflineRecordToZipBlob(record: OfflineBookRecord): Blob {
    const zipObj: Record<string, Uint8Array> = {
        'manifest.json': strToU8(JSON.stringify(record.manifest)),
        'book.json': strToU8(JSON.stringify(record.book)),
    };
    const zipped = zipSync(zipObj, { level: 6 });
    return new Blob([new Uint8Array(zipped)], { type: 'application/zip' });
}
