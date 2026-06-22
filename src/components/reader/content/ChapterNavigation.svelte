<script lang="ts">
    import type { Chapter } from '$lib/types';

    let { chapters, currentChapter, loadChapter }: {
        chapters: Chapter[];
        currentChapter: Chapter;
        loadChapter: (c: Chapter) => void;
    } = $props();

    let currIdx = $derived(chapters.findIndex(c => c.id === currentChapter.id));
    let prevChapter = $derived(currIdx > 0 ? chapters[currIdx - 1] : null);
    let nextChapter = $derived(currIdx < chapters.length - 1 ? chapters[currIdx + 1] : null);
</script>

{#if chapters.length > 0}
    <div class="flex justify-between w-full mt-16 pt-8 border-t border-base-200 gap-4">
        {#if prevChapter}
            <button class="btn btn-outline" onclick={() => loadChapter(prevChapter)}>
                &larr; {prevChapter.title || 'Previous'}
            </button>
        {:else}
            <div></div>
        {/if}

        {#if nextChapter}
            <button class="btn btn-outline text-right" onclick={() => loadChapter(nextChapter)}>
                {nextChapter.title || 'Next'} &rarr;
            </button>
        {:else}
            <div></div>
        {/if}
    </div>
{/if}
