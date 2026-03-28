import type { Sentence } from '@/types';
import type { OfflineBookPayload, OfflineBundleManifest, ParsedOfflineBundle } from '@/types/offlineBundle';

export function buildSentencesByPageMap(book: OfflineBookPayload): Map<number, Sentence[]> {
    const sentencesByPage = new Map<number, Sentence[]>();
    for (const [p, list] of Object.entries(book.sentencesByPage)) {
        sentencesByPage.set(Number(p), list);
    }
    return sentencesByPage;
}

export function buildParsedBundleFromBook(
    manifest: OfflineBundleManifest,
    book: OfflineBookPayload,
): ParsedOfflineBundle {
    return {
        manifest,
        book,
        sentencesByPage: buildSentencesByPageMap(book),
    };
}
