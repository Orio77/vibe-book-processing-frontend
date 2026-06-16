<script lang="ts">
    import { uploadPdf } from '../lib/api/features/pdf';
    import { addPendingUploadJobId } from '../lib/pendingUploadJobs';
    import type { ChapterPageRange } from '../lib/types';
    import FileDropzone from '../components/upload/FileDropzone.svelte';
    import ChapterRanges from '../components/upload/ChapterRanges.svelte';
    import { navigate } from '../lib/navigation';

    let file = $state<File | null>(null);
    let ranges = $state<{ id: number; startPage: number; endPage: number }[]>([]);
    let isUploading = $state(false);

    async function submitUpload() {
        if (!file) return;
        isUploading = true;
        try {
            const mappedRanges: ChapterPageRange[] = ranges.map(r => ({ startPage: r.startPage, endPage: r.endPage }));
            const res = await uploadPdf(file, mappedRanges);
            if (res.mode === 'queued') {
                addPendingUploadJobId(res.jobId);
            }
            navigate('/library');
        } catch (e) {
            console.error("Upload failed", e);
            alert("Upload failed. Check console for details.");
            isUploading = false;
        }
    }
</script>

<div class="max-w-4xl mx-auto py-8">
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-base-content mb-2">Upload New PDF</h1>
        <p class="text-base-content/60">Select a book and define its chapters for processing.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Left: File Dropzone -->
        <div class="flex flex-col gap-4">
            <h2 class="text-xl font-semibold">1. Select PDF</h2>
            <FileDropzone bind:file />
        </div>

        <!-- Right: Chapter Ranges & Submit -->
        <div class="flex flex-col gap-4">
            <h2 class="text-xl font-semibold">2. Define Chapters (Optional)</h2>
            <ChapterRanges 
                bind:ranges
                {file}
                {isUploading}
                onSubmit={submitUpload}
            />
        </div>
    </div>
</div>
