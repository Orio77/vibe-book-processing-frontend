import {
    fetchIdeasByChapterId,
    markKeyIdeas,
    createIdeaExplanation,
    fetchIdeaExplanations
} from '$lib/api/index';
import { stompStore } from '$lib/stores/stomp.svelte';
import { settingsStore } from '$lib/stores/settings.svelte';
import { highlightsStore } from '$lib/stores/highlights.svelte';
import type { Chapter, IdeaWithSentences, IdeaExplanationDTO } from '$lib/types';

export class IdeasState {
    getChapter: () => Chapter;
    getIsOffline: () => boolean;
    ideas = $state<IdeaWithSentences[]>([]);
    explanations = $state<Record<number, IdeaExplanationDTO[]>>({});
    
    get expandedIdea(): number | null {
        return highlightsStore.expandedIdeaId;
    }
    set expandedIdea(val: number | null) {
        highlightsStore.expandedIdeaId = val;
    }
    
    isLoading = $state(true);
    error = $state('');

    constructor(getChapter: () => Chapter, getIsOffline: () => boolean) {
        this.getChapter = getChapter;
        this.getIsOffline = getIsOffline;
        
        $effect(() => {
            if (this.getChapter()) {
                this.loadIdeas();
                this.explanations = {};
                this.expandedIdea = null;
            }
        });

        $effect(() => {
            const completedIdeaJob = stompStore.activeJobs.find(
                j => j.type === 'IDEA_EXTRACTION' && j.status === 'COMPLETED'
            );
            if (completedIdeaJob) {
                this.loadIdeas();
            }
        });

        $effect(() => {
            highlightsStore.ideas = this.ideas;
            const ideaIds = new Set<number>();
            this.ideas.forEach(idea => {
                idea.sentences?.forEach(s => ideaIds.add(s.sentenceId));
            });
            highlightsStore.ideaSentenceIds = ideaIds;
        });

        $effect(() => {
            const completedExplJobs = stompStore.activeJobs.filter(
                j => j.type === 'IDEA_EXPLANATION' && j.status === 'COMPLETED' && j.ideaId
            );
            completedExplJobs.forEach(job => {
                if (job.ideaId) this.loadExplanations(job.ideaId);
            });
        });
    }

    get isExtracting() {
        const chapter = this.getChapter();
        return chapter ? stompStore.activeJobs.some(j => j.type === 'IDEA_EXTRACTION' && j.chapterId === chapter.id) : false;
    }

    isExplaining(ideaId: number) {
        return stompStore.activeJobs.some(j => j.type === 'IDEA_EXPLANATION' && j.ideaId === ideaId);
    }

    async loadIdeas() {
        const chapter = this.getChapter();
        if (!chapter) return;
        this.isLoading = true;
        try {
            this.ideas = await fetchIdeasByChapterId(chapter.id);
        } catch (e) {
            console.error(e);
        } finally {
            this.isLoading = false;
        }
    }

    async handleExtract() {
        const chapter = this.getChapter();
        if (!chapter) return;
        try {
            const res = await markKeyIdeas(chapter.id);
            if (res.mode === 'queued') {
                stompStore.addJob(res.jobId, 'IDEA_EXTRACTION', { chapterId: chapter.id });
            } else {
                this.loadIdeas();
            }
        } catch (e: any) {
            this.error = e.message || 'Failed to extract ideas';
        }
    }

    async loadExplanations(ideaId: number) {
        try {
            const exp = await fetchIdeaExplanations(ideaId);
            this.explanations[ideaId] = exp;
        } catch (e) {
            console.error(e);
        }
    }

    async handleExplain(idea: IdeaWithSentences) {
        if (settingsStore.forceOfflineLlm || this.getIsOffline()) {
            try {
                const { generateIdeaExplanation } = await import('$lib/llm/openaiCompatible');
                const { fetchIdeaArguments } = await import('$lib/api/index');
                
                const argsDto = await fetchIdeaArguments(idea.idea.ideaId);
                const args = argsDto.map(a => a.text);

                const settings = {
                    apiKey: settingsStore.llmApiKey,
                    baseUrl: settingsStore.llmBaseUrl,
                    model: settingsStore.llmModel
                };
                
                const answer = await generateIdeaExplanation(settings, idea.idea.ideaTitle, args);
                
                const newExp: IdeaExplanationDTO = {
                    id: Date.now(),
                    ideaId: idea.idea.ideaId,
                    text: answer
                };
                
                const existing = this.explanations[idea.idea.ideaId] || [];
                this.explanations[idea.idea.ideaId] = [newExp, ...existing];
            } catch (e: any) {
                console.error(e);
                this.error = e.message || 'Failed to generate explanation offline';
            }
            return;
        }

        try {
            const res = await createIdeaExplanation(idea.idea.ideaId, idea.idea.ideaTitle);
            if (res.mode === 'queued') {
                stompStore.addJob(res.jobId, 'IDEA_EXPLANATION', { ideaId: idea.idea.ideaId });
            } else {
                this.loadExplanations(idea.idea.ideaId);
            }
        } catch (e: any) {
            this.error = e.message || 'Failed to generate explanation';
        }
    }

    toggleExpand(ideaId: number) {
        if (this.expandedIdea === ideaId) {
            this.expandedIdea = null;
        } else {
            this.expandedIdea = ideaId;
            if (!this.explanations[ideaId]) {
                this.loadExplanations(ideaId);
            }
        }
    }
}
