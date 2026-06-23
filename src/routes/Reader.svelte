<script lang="ts">
    import { onMount } from "svelte";
    import {
        fetchPdf,
        fetchChapters,
        fetchSentencesInRanges,
    } from "../lib/api/index";
    import type { PDF, Chapter, Sentence } from "../lib/types";

    import ReaderProgressBar from "../components/reader/ReaderProgressBar.svelte";
    import ReaderSidebar from "../components/reader/ReaderSidebar.svelte";
    import ReaderContent from "../components/reader/ReaderContent.svelte";
    import { stompStore } from "$lib/stores/stomp.svelte";

    import { selectionStore } from "$lib/stores/selection.svelte";

    let { id }: { id: string | number } = $props();

    let isOffline = $derived(typeof id === 'string' && id.startsWith('offline-'));
    let offlineId = $derived(typeof id === 'string' ? id.replace('offline-', '') : '');
    
    let parsedId = $derived(
        typeof id === "string"
            ? Number(id.replace(/^(online|offline)-/, ""))
            : Number(id),
    );

    let pdf = $state<PDF | null>(null);
    let chapters = $state<Chapter[]>([]);
    let currentChapter = $state<Chapter | null>(null);
    let sentences = $state<Sentence[]>([]);
    let isLoading = $state(true);
    let isChapterLoading = $state(false);
    let offlineRecord = $state<any>(null);

    async function loadData() {
        if (!isOffline && (!parsedId || isNaN(parsedId))) return;
        isLoading = true;
        try {
            if (isOffline) {
                const { getOfflineBookRecord } = await import('$lib/offline/libraryDb');
                const record = await getOfflineBookRecord(offlineId);
                if (record) {
                    offlineRecord = record;
                    pdf = record.book.pdf;
                    chapters = record.book.chapters;
                    if (chapters.length > 0) {
                        await loadChapter(chapters[0]);
                    }
                }
            } else {
                pdf = await fetchPdf(parsedId);
                chapters = await fetchChapters(parsedId);
                if (chapters.length > 0) {
                    await loadChapter(chapters[0]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            isLoading = false;
        }
    }

    async function loadChapter(chapter: Chapter) {
        currentChapter = chapter;
        isChapterLoading = true;
        try {
            if (isOffline && offlineRecord) {
                const sentencesList = [];
                for (let p = chapter.startPage; p <= chapter.endPage; p++) {
                    const pageSentences = offlineRecord.book.sentencesByPage[p] || [];
                    sentencesList.push(...pageSentences);
                }
                sentences = sentencesList;
            } else {
                const ranges = await fetchSentencesInRanges(parsedId, [
                    { startPage: chapter.startPage, endPage: chapter.endPage },
                ]);
                sentences = ranges[0] || [];
            }
        } catch (e) {
            console.error(e);
        } finally {
            isChapterLoading = false;
        }
    }

    onMount(() => {
        loadData();
        stompStore.connect();

        return () => {
            stompStore.disconnect();
            selectionStore.clearSelection();
            selectionStore.setSelectionMode(false);
        };
    });

    let touchStartX = 0;
    let touchEndX = 0;
    const SWIPE_THRESHOLD = 80; // pixels needed to count as a swipe

    function handleTouchStart(e: TouchEvent) {
        touchStartX = e.changedTouches[0].screenX;
    }

    function handleTouchEnd(e: TouchEvent) {
        touchEndX = e.changedTouches[0].screenX;

        const drawer = document.getElementById('reader-drawer') as HTMLInputElement;
        if (!drawer) return;

        // Swipe right -> Open drawer
        if (touchEndX - touchStartX > SWIPE_THRESHOLD) {
            drawer.checked = true;
        } 
        // Swipe left -> Close drawer
        else if (touchStartX - touchEndX > SWIPE_THRESHOLD) {
            drawer.checked = false;
        }
    }
</script>

<div 
    class="drawer lg:drawer-open flex-grow"
    ontouchstart={handleTouchStart}
    ontouchend={handleTouchEnd}
>
    <input id="reader-drawer" type="checkbox" class="drawer-toggle" />

    <div
        class="drawer-content flex flex-col items-center p-4 md:p-8 bg-base-100 min-h-[calc(100vh-4rem)]"
    >
        <ReaderProgressBar {isChapterLoading} {sentences} />

        <ReaderContent
            {pdf}
            {chapters}
            {currentChapter}
            {sentences}
            {isLoading}
            {isChapterLoading}
            {loadChapter}
        />
    </div>

    <ReaderSidebar {pdf} {chapters} {currentChapter} {isLoading} {loadChapter} {sentences} {isOffline} />
</div>
