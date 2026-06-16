<script lang="ts">
    import { navigate } from '../../lib/navigation';

    function setTheme(theme: string) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }
</script>

<div class="navbar bg-base-100 border-b border-base-200 px-4 md:px-8">
    <div class="flex-1 flex flex-row gap-8 items-center">
        <!-- Logo -->
        <button class="flex items-center gap-2 cursor-pointer appearance-none bg-transparent border-none text-left" onclick={() => navigate('/')}>
            <div class="bg-primary text-primary-content p-1.5 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <span class="text-xl font-bold">BookProcessing</span>
        </button>

        <!-- Links -->
        <div class="hidden md:flex gap-2">
            <button class="btn btn-sm btn-ghost text-primary" onclick={() => navigate('/library')}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Library
            </button>
            <button class="btn btn-sm btn-ghost text-base-content/70" onclick={() => navigate('/upload')}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload PDF
            </button>
            <button class="btn btn-sm btn-ghost text-base-content/70">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                Offline library
            </button>
        </div>
    </div>
    <div class="flex-none">
        <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn m-1 btn-ghost btn-sm">
                Theme
                <svg width="12px" height="12px" class="inline-block h-2 w-2 fill-current opacity-60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
            </div>
            <ul tabindex="-1" class="dropdown-content bg-base-200 rounded-box z-[1] w-52 p-2 shadow-2xl">
                <li><button class="w-full btn btn-sm btn-block btn-ghost justify-start" onclick={() => setTheme('default')}>Default</button></li>
                <li><button class="w-full btn btn-sm btn-block btn-ghost justify-start" onclick={() => setTheme('light')}>Light</button></li>
                <li><button class="w-full btn btn-sm btn-block btn-ghost justify-start" onclick={() => setTheme('dark')}>Dark</button></li>
                <li><button class="w-full btn btn-sm btn-block btn-ghost justify-start" onclick={() => setTheme('retro')}>Retro</button></li>
                <li><button class="w-full btn btn-sm btn-block btn-ghost justify-start" onclick={() => setTheme('cyberpunk')}>Cyberpunk</button></li>
                <li><button class="w-full btn btn-sm btn-block btn-ghost justify-start" onclick={() => setTheme('valentine')}>Valentine</button></li>
                <li><button class="w-full btn btn-sm btn-block btn-ghost justify-start" onclick={() => setTheme('aqua')}>Aqua</button></li>
            </ul>
        </div>
    </div>
</div>
