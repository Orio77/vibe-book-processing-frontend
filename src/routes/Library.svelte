<script lang="ts">
    import BookCard from "../components/library/BookCard.svelte";
    import LoadingBookCard from "../components/library/LoadingBookCard.svelte";
    import { navigate } from "../lib/navigation";
    import {
        createLibraryStore,
        type UnifiedBook,
    } from "$lib/stores/library.svelte";
    import ErrorAlert from "../components/common/ErrorAlert.svelte";
    import ExportOfflinePackModal, {
        type OfflineExportConfirmOptions,
        type OfflineLibraryUpdateTarget,
    } from "../components/library/ExportOfflinePackModal.svelte";
    import DeleteConfirmModal from "../components/library/DeleteConfirmModal.svelte";
    import {
        listOfflineBookRecordsForSourcePdf,
        exportOfflineRecordToZipBlob,
        buildOfflineBundlePayload,
        offlineBundlePayloadToZipBlob,
        saveOfflineBundleToLibrary,
        mergeOfflineRecordWithNewPayload,
        getOfflineBookRecord,
        putOfflineBookRecord,
    } from "$lib/offline";
    import { flip } from "svelte/animate";
    import { scale, crossfade } from "svelte/transition";
    import { backOut } from "svelte/easing";

    const library = createLibraryStore();

    const [send, receive] = crossfade({
        duration: 700,
        easing: backOut,
        fallback(node, params) {
            if (library.isInitialLoad) return { duration: 0 };

            const duration = typeof params.duration === 'number' ? params.duration : 700;
            const delay = typeof params.delay === 'number' ? params.delay : 0;
            return scale(node, { start: 0.9, duration, delay, easing: backOut });
        }
    });

    let modalOpen = $state(false);
    let modalBusy = $state(false);
    let modalUpdateTargets = $state<OfflineLibraryUpdateTarget[]>([]);
    let selectedBookForExport = $state<UnifiedBook | null>(null);

    let deleteModalOpen = $state(false);
    let deleteModalBusy = $state(false);
    let bookToDelete = $state<UnifiedBook | null>(null);

    let errorMsg = $state<string | null>(null);

    async function handleDownloadClick(book: UnifiedBook) {
        if (book.id.toString().startsWith("offline-")) {
            const exportId = book.id.toString().replace("offline-", "");
            const record = await getOfflineBookRecord(exportId);
            if (!record) {
                errorMsg = "Offline record not found";
                return;
            }
            const blob = exportOfflineRecordToZipBlob(record);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const safeTitle = (book.title || "book")
                .replace(/[^\w\s-]/g, "")
                .trim()
                .replace(/\s+/g, "-");
            a.download = `${safeTitle}-offline-pack.zip`;
            a.click();
            URL.revokeObjectURL(url);
            return;
        }

        selectedBookForExport = book;
        const numId = Number(book.id.toString().replace("online-", ""));
        const records = await listOfflineBookRecordsForSourcePdf(numId);
        modalUpdateTargets = records.map((r) => ({
            exportId: r.exportId,
            label: r.manifest.sourcePdfTitle ?? book.title,
        }));
        modalOpen = true;
    }

    async function handleModalConfirm(options: OfflineExportConfirmOptions) {
        if (!selectedBookForExport) return;
        modalBusy = true;
        try {
            const numId = Number(
                selectedBookForExport.id.toString().replace("online-", ""),
            );
            const payload = await buildOfflineBundlePayload(numId.toString());

            if (options.downloadZip) {
                const blob = offlineBundlePayloadToZipBlob(payload);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const safeTitle = (selectedBookForExport.title || "book")
                    .replace(/[^\w\s-]/g, "")
                    .trim()
                    .replace(/\s+/g, "-");
                a.download = `${safeTitle}-offline-pack.zip`;
                a.click();
                URL.revokeObjectURL(url);
            }

            if (options.saveToLibrary) {
                if (options.updateLibraryExportId) {
                    const existing = await getOfflineBookRecord(
                        options.updateLibraryExportId,
                    );
                    if (existing) {
                        const merged = mergeOfflineRecordWithNewPayload(
                            existing,
                            payload,
                        );
                        await putOfflineBookRecord(merged);
                    } else {
                        throw new Error("Target record not found");
                    }
                } else {
                    await saveOfflineBundleToLibrary(
                        payload.manifest,
                        payload.book,
                        1,
                    );
                }
                await library.fetchLibraryData();
            }
            modalOpen = false;
        } catch (e) {
            console.error(e);
            errorMsg = "Failed to export offline pack: " + String(e);
        } finally {
            modalBusy = false;
        }
    }

    function handleDeleteClick(book: UnifiedBook) {
        bookToDelete = book;
        deleteModalOpen = true;
    }

    async function handleDeleteConfirm() {
        if (!bookToDelete) return;
        deleteModalBusy = true;
        try {
            await library.deleteLibraryBook(bookToDelete.id);
            deleteModalOpen = false;
        } catch (e) {
            console.error(e);
            errorMsg = "Failed to delete book: " + String(e);
        } finally {
            deleteModalBusy = false;
            bookToDelete = null;
        }
    }
</script>

<div class="py-4">
    <div class="max-w-xl mx-auto">
        <ErrorAlert message={errorMsg} onDismiss={() => (errorMsg = null)} />
    </div>
    <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
    >
        <div>
            <h1 class="text-3xl font-bold text-base-content mb-1">
                Your Library
            </h1>
            <p class="text-base-content/60">
                Manage and read your uploaded books
            </p>
        </div>
        <button class="btn btn-primary" onclick={() => navigate("/upload")}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                /></svg
            >
            Add New Book
        </button>
    </div>

    <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
    >
        {#if library.isLoading}
            <LoadingBookCard />
            <LoadingBookCard />
            <LoadingBookCard />
            <LoadingBookCard />
            <LoadingBookCard />
        {:else if library.books.length === 0 && library.pendingJobs.length === 0}
            <div class="col-span-full py-12 text-center text-base-content/50">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-12 w-12 mx-auto mb-4 opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    /></svg
                >
                <p>No books in your library yet.</p>
            </div>
        {:else}
            {#each library.books as book (book.id)}
                <div
                    class:stagger-enter={library.isInitialLoad}
                    animate:flip={{ duration: 700 }}
                    in:receive={{ key: book.id, delay: 200 }}
                    out:send={{ key: book.id }}
                >
                    <BookCard
                        {book}
                        onRead={() => navigate("/read/" + book.id)}
                        onDelete={() => handleDeleteClick(book)}
                        onDownload={() => handleDownloadClick(book)}
                    />
                </div>
            {/each}
        {/if}

        {#each library.pendingJobs as jobId (jobId)}
            <div
                class:stagger-enter={library.isInitialLoad}
                animate:flip={{ duration: 700 }}
                in:receive={{ key: `job-${jobId}`, delay: 200 }}
                out:send={{
                    key: library.completedJobsMap.get(jobId) || `job-${jobId}`,
                    duration: 300,
                }}
            >
                <LoadingBookCard />
            </div>
        {/each}
    </div>
</div>

<ExportOfflinePackModal
    bind:isOpen={modalOpen}
    busy={modalBusy}
    libraryUpdateTargets={modalUpdateTargets}
    onConfirm={handleModalConfirm}
/>

<DeleteConfirmModal
    bind:isOpen={deleteModalOpen}
    busy={deleteModalBusy}
    bookTitle={bookToDelete?.title}
    onConfirm={handleDeleteConfirm}
/>
