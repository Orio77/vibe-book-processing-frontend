import { fetchChat, fetchChatResponsesForChapter } from '$lib/api/index';
import { stompStore } from '$lib/stores/stomp.svelte';
import { selectionStore } from '$lib/stores/selection.svelte';
import type { Chapter, Sentence, PDFChatResponse } from '$lib/types';

export class ChatState {
    getChapter: () => Chapter;
    getSentences: () => Sentence[];
    responses = $state<PDFChatResponse[]>([]);
    query = $state('');
    isLoading = $state(false);
    error = $state('');

    constructor(getChapter: () => Chapter, getSentences: () => Sentence[]) {
        this.getChapter = getChapter;
        this.getSentences = getSentences;

        $effect(() => {
            if (this.getChapter()) {
                this.loadChat();
            }
        });

        $effect(() => {
            const completedChatJob = stompStore.activeJobs.find(
                j => j.type === 'CHAT' && j.status === 'COMPLETED'
            );
            if (completedChatJob) {
                this.loadChat();
            }
        });
    }

    get isThinking() {
        const chapter = this.getChapter();
        return chapter ? stompStore.activeJobs.some(j => j.type === 'CHAT' && j.chapterId === chapter.id) : false;
    }

    async loadChat() {
        const chapter = this.getChapter();
        if (!chapter) return;
        this.isLoading = true;
        try {
            this.responses = await fetchChatResponsesForChapter(chapter.id);
        } catch (e) {
            console.error(e);
        } finally {
            this.isLoading = false;
        }
    }

    async handleSend() {
        const chapter = this.getChapter();
        const sentences = this.getSentences();
        
        if (!chapter || !this.query.trim()) return;
        
        // Build context from selection
        const context = sentences
            .filter(s => selectionStore.isSelected(s.id))
            .map(s => ({
                sentenceId: s.id,
                sentenceContent: s.content
            }));

        try {
            const res = await fetchChat({
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                query: this.query.trim(),
                context
            });

            if (res.mode === 'queued') {
                stompStore.addJob(res.jobId, 'CHAT', { chapterId: chapter.id });
                this.query = '';
                selectionStore.clearSelection();
                selectionStore.setSelectionMode(false);
            } else {
                this.loadChat();
            }
        } catch (e: any) {
            this.error = e.message || 'Failed to send query';
        }
    }
}
