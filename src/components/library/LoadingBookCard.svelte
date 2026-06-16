<script lang="ts">
</script>

<div class="card bg-base-100 border border-base-200 shadow-sm h-full flex flex-col relative overflow-hidden">
    <!-- Shimmer effect -->
    <div class="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-base-content/5 to-transparent z-10"></div>
    
    <!-- Book Cover Skeleton -->
    <div class="relative bg-base-200/50 aspect-[3/4] flex items-center justify-center rounded-t-2xl overflow-hidden shadow-inner shrink-0 p-6">
        <div class="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-base-content/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
        </div>
        
        <div class="absolute inset-x-0 bottom-0 p-4 pt-12">
            <div class="h-4 bg-base-300 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-base-300 rounded w-1/2"></div>
        </div>
    </div>
    
    <!-- Book Info Skeleton -->
    <div class="p-4 border-t border-base-200 flex flex-col flex-grow gap-3">
        <div class="h-5 bg-base-300 rounded w-full"></div>
        <div class="flex items-center gap-2 mb-2">
            <div class="h-3 bg-base-300 rounded w-16"></div>
            <div class="h-3 bg-base-300 rounded w-16"></div>
        </div>
        
        <div class="flex items-center justify-between mt-auto">
            <div class="h-4 bg-base-300 rounded w-12"></div>
            <div class="h-6 w-6 bg-base-300 rounded-full"></div>
        </div>
    </div>
</div>

<style>
    @keyframes shimmer {
        100% {
            transform: translateX(100%);
        }
    }
</style>
