import { fetchChat, fetchChatResponsesForChapter } from '$lib/api/index';
import { stompStore } from '$lib/stores/stomp.svelte';
import { selectionStore } from '$lib/stores/selection.svelte';
import { settingsStore } from '$lib/stores/settings.svelte';
import { highlightsStore } from '$lib/stores/highlights.svelte';
import type { Chapter, Sentence, PDFChatResponse } from '$lib/types';

export class ChatState {
    getChapter: () => Chapter;
    getSentences: () => Sentence[];
    getIsOffline: () => boolean;
    responses = $state<PDFChatResponse[]>([]);
    query = $state('');
    isLoading = $state(false);
    error = $state('');

    constructor(getChapter: () => Chapter, getSentences: () => Sentence[], getIsOffline: () => boolean) {
        this.getChapter = getChapter;
        this.getSentences = getSentences;
        this.getIsOffline = getIsOffline;

        $effect(() => {
            if (this.getChapter()) {
                this.loadChat();
            }
        });

        $effect(() => {
            const chatIds = new Set<number>();
            this.responses.forEach(r => {
                r.contextSentencesIds?.forEach(id => chatIds.add(id));
            });
            highlightsStore.chatSentenceIds = chatIds;
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

        // Build context from selection
        const context = sentences
            .filter(s => selectionStore.isSelected(s.id))
            .map(s => ({
                sentenceId: s.id,
                sentenceContent: s.content
            }));

        if (!chapter || context.length === 0) return;

        const currentQuery = this.query.trim();

        if (settingsStore.forceOfflineLlm || this.getIsOffline()) {
            this.isLoading = true;
            try {
                const { answerQueryWithContext } = await import('$lib/llm/openaiCompatible');
                const settings = {
                    apiKey: settingsStore.llmApiKey,
                    baseUrl: settingsStore.llmBaseUrl,
                    model: settingsStore.llmModel
                };

                // Call LLM directly from browser
                const answer = await answerQueryWithContext(settings, currentQuery, context);

                // Add synthetic response to chat history
                this.responses = [{
                    chatResponseId: Date.now(),
                    query: currentQuery,
                    chatResponse: answer,
                    contextSentencesIds: context.map(c => c.sentenceId)
                }, ...this.responses];

                this.query = '';
                selectionStore.clearSelection();
                selectionStore.setSelectionMode(false);
            } catch (e: any) {
                console.error(e);
                this.error = e.message || 'Failed to send query directly to LLM';
            } finally {
                this.isLoading = false;
            }
            return;
        }

        try {
            const res = await fetchChat({
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                query: currentQuery,
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
