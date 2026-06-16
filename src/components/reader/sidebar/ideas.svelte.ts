import {
    fetchIdeasByChapterId,
    markKeyIdeas,
    createIdeaExplanation,
    fetchIdeaExplanations
} from '$lib/api/index';
import { stompStore } from '$lib/stores/stomp.svelte';
import type { Chapter, IdeaWithSentences, IdeaExplanationDTO } from '$lib/types';

export class IdeasState {
    getChapter: () => Chapter;
    ideas = $state<IdeaWithSentences[]>([]);
    explanations = $state<Record<number, IdeaExplanationDTO[]>>({});
    expandedIdea = $state<number | null>(null);
    isLoading = $state(false);
    error = $state('');

    constructor(getChapter: () => Chapter) {
        this.getChapter = getChapter;
        
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
