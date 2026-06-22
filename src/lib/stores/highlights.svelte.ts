import { tick } from 'svelte';
import type { IdeaWithSentences } from '$lib/types';

export type SidebarTab = 'toc' | 'summary' | 'ideas' | 'chat';

class HighlightsState {
    activeTab = $state<SidebarTab>('toc');
    ideaSentenceIds = $state<Set<number>>(new Set());
    chatSentenceIds = $state<Set<number>>(new Set());
    ideas = $state<IdeaWithSentences[]>([]);
    expandedIdeaId = $state<number | null>(null);

    async scrollToIdea(id: number) {
        await tick();
        const element = document.querySelector(`[data-idea-id="${id}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            element.classList.add('ring-2', 'ring-accent', 'transition-all', 'duration-500');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-accent');
            }, 1000);
        }
    }

    async scrollToSentence(id: number) {
        await tick();
        const element = document.querySelector(`[data-sentence-id="${id}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            element.classList.add('bg-accent/30', 'transition-colors', 'duration-500');
            setTimeout(() => {
                element.classList.remove('bg-accent/30');
            }, 500);
        }
    }

    openTab(tab: SidebarTab) {
        this.activeTab = tab;
        const drawer = document.getElementById('reader-drawer') as HTMLInputElement | null;
        if (drawer) {
            drawer.checked = true;
        }
    }
}

export const highlightsStore = new HighlightsState();
