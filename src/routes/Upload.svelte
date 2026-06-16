<script lang="ts">
    import { uploadPdf } from '../lib/api/features/pdf';
    import { addPendingUploadJobId } from '../lib/pendingUploadJobs';
    import type { ChapterPageRange } from '../lib/types';
    import FileDropzone from '../components/upload/FileDropzone.svelte';
    import ChapterRanges from '../components/upload/ChapterRanges.svelte';
    import type { RangeItem } from '../components/upload/ChapterRanges.svelte';
    import { navigate } from '../lib/navigation';

    let file = $state<File | null>(null);
    let ranges = $state<RangeItem[]>([]);
    let isUploading = $state(false);

    async function submitUpload() {
        if (!file) return;
        isUploading = true;
        try {
            const finalRanges: ChapterPageRange[] = [];
            
            // Sort ranges by start page
            const sorted = [...ranges].sort((a, b) => a.startPage - b.startPage);
            
            if (sorted.length === 0) {
                // If no chapters selected, one big chapter of the whole book
                finalRanges.push({ startPage: 1, endPage: 999999 });
            } else {
                let currentPage = 1;
                
                for (let i = 0; i < sorted.length; i++) {
                    const r = sorted[i];
                    
                    // Fill gap before this chapter if necessary
                    if (r.startPage > currentPage) {
                        finalRanges.push({ startPage: currentPage, endPage: r.startPage - 1 });
                    }
                    
                    // Determine end page for this chapter
                    let endP = 999999;
                    if (r.hasCustomEnd) {
                        endP = Math.max(r.startPage, r.endPage);
                    } else {
                        // Auto end page: until next chapter start - 1
                        const next = sorted[i + 1];
                        if (next && next.startPage > r.startPage) {
                            endP = next.startPage - 1;
                        }
                    }
                    
                    finalRanges.push({ startPage: r.startPage, endPage: endP });
                    currentPage = endP + 1;
                }
                
                // If the last chapter had a custom end page, fill the rest of the book
                if (currentPage <= 999999 && sorted[sorted.length - 1].hasCustomEnd) {
                    finalRanges.push({ startPage: currentPage, endPage: 999999 });
                }
            }

            const res = await uploadPdf(file, finalRanges);
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
