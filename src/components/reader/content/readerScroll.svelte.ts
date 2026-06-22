import { tick } from 'svelte';
import type { Chapter } from '$lib/types';

export class ReaderScrollState {
    previousChapterId = $state<number | null>(null);
    slideDirection = $state(1);
    scrollPositions = $state<Record<number, number>>({});

    constructor(getChapters: () => Chapter[], getCurrentChapter: () => Chapter | null, getIsChapterLoading: () => boolean) {
        $effect(() => {
            const currentChapter = getCurrentChapter();
            const chapters = getChapters();
            if (currentChapter && currentChapter.id !== this.previousChapterId) {
                const currIdx = chapters.findIndex(c => c.id === currentChapter?.id);
                const prevIdx = chapters.findIndex(c => c.id === this.previousChapterId);
                this.slideDirection = currIdx > prevIdx ? 1 : -1;
                this.previousChapterId = currentChapter.id;
            }
        });

        $effect(() => {
            const currentChapter = getCurrentChapter();
            const isChapterLoading = getIsChapterLoading();
            // Restore scroll position when chapter finishes loading
            if (!isChapterLoading && currentChapter) {
                tick().then(() => {
                    window.scrollTo({ top: this.scrollPositions[currentChapter.id] || 0, behavior: 'instant' });
                });
            }
        });
    }

    handleScroll(currentChapter: Chapter | null, isChapterLoading: boolean) {
        if (currentChapter && !isChapterLoading) {
            this.scrollPositions[currentChapter.id] = window.scrollY;
        }
    }
}
