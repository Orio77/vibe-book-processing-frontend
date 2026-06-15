import type { Chapter } from '$lib/types';
import type { OfflineBookPayload } from '$lib/types/offlineBundle';

/**
 * Concatenates all sentences for `chapter` from an offline pack (pages startPage..endPage),
 * in reading order — same logical scope as online `chapterId` on the server.
 */
export function buildOfflineFullChapterPlainText(
    book: OfflineBookPayload,
    chapter: Chapter,
): string {
    const chunks: string[] = [];
    for (let page = chapter.startPage; page <= chapter.endPage; page++) {
        const rows = book.sentencesByPage[page] ?? [];
        const scoped = rows
            .filter((s) => s.chapterId === chapter.id)
            .sort((a, b) => a.sentenceIndex - b.sentenceIndex || a.id - b.id);
        for (const s of scoped) {
            const t = s.content.trim();
            if (t.length > 0) chunks.push(t);
        }
    }
    return chunks.join('\n\n');
}
