import { createChapterSummary, getSummaryByChapterId } from '$lib/api/index';
import { stompStore } from '$lib/stores/stomp.svelte';
import type { Chapter, ChapterSummary } from '$lib/types';

export class SummaryState {
    getChapter: () => Chapter;
    summaries = $state<ChapterSummary[]>([]);
    isLoading = $state(true);
    error = $state('');

    constructor(getChapter: () => Chapter) {
        this.getChapter = getChapter;

        $effect(() => {
            if (this.getChapter()) {
                this.loadSummaries();
            }
        });

        $effect(() => {
            const completedSummaryJob = stompStore.activeJobs.find(
                j => j.type === 'CHAPTER_SUMMARY' && j.status === 'COMPLETED'
            );
            if (completedSummaryJob) {
                this.loadSummaries();
            }
        });
    }

    get isGenerating() {
        const chapter = this.getChapter();
        return chapter ? stompStore.activeJobs.some(j => j.type === 'CHAPTER_SUMMARY' && j.chapterId === chapter.id) : false;
    }

    async loadSummaries() {
        const chapter = this.getChapter();
        if (!chapter) return;
        this.isLoading = true;
        try {
            this.summaries = await getSummaryByChapterId(chapter.id);
        } catch (e) {
            console.error(e);
        } finally {
            this.isLoading = false;
        }
    }

    async handleGenerate() {
        const chapter = this.getChapter();
        if (!chapter) return;
        try {
            const res = await createChapterSummary(chapter.id);
            if (res.mode === 'queued') {
                stompStore.addJob(res.jobId, 'CHAPTER_SUMMARY', { chapterId: chapter.id });
            } else if (res.mode === 'ready') {
                this.loadSummaries();
            }
        } catch (e: any) {
            this.error = e.message || 'Failed to generate summary';
        }
    }
}
