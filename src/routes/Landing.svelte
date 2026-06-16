<script lang="ts">
    import Login from './Login.svelte';
    import Register  from './Register.svelte';
    import { fly, fade } from 'svelte/transition';

    import { navigate } from '../lib/navigation';
    import { createLoginStore } from '$lib/stores/login.svelte';
    import { createRegisterStore } from '$lib/stores/register.svelte';
    import { authStore } from '$lib/stores/auth.svelte';

    let showLogin = $state(true);

    // Lift stores to parent so they survive tab switches
    const loginStore = createLoginStore();
    const registerStore = createRegisterStore();
</script>

<div class="relative flex flex-col md:flex-row min-h-[85vh] items-center justify-center gap-12 max-w-5xl mx-auto py-12">
    <!-- Left: Text Block -->
    <div class="flex-1 space-y-6 text-center md:text-left">
        <h1 class="text-5xl font-bold leading-tight text-base-content">
            Smarter Reading<br />with <span class="text-primary">AI Processing</span>
        </h1>
        <p class="text-lg text-base-content/70">
            Upload your PDFs, automatically extract chapters, chat with your books, and generate intelligent summaries—all with full offline support.
        </p>
    </div>

    <!-- Right: Auth Form or Logged-in state -->
    <div class="flex-1 w-full max-w-md">
        {#if authStore.loggedIn}
            <div class="card bg-base-100 shadow-xl border border-base-200 overflow-hidden" in:fade={{ duration: 300 }}>
                <div class="card-body items-center text-center py-12 gap-4">
                    <div class="bg-success/10 text-success p-4 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 class="card-title text-2xl font-bold">You're logged in!</h2>
                    <p class="text-base-content/70">Access your library and start reading.</p>
                    <button class="btn btn-primary btn-wide mt-2" onclick={() => navigate('/library')}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Go to Library
                    </button>
                </div>
            </div>
        {:else}
            <div class="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                <!-- Tabs -->
                <div class="flex p-2 bg-base-200/50 border-b border-base-200 gap-2">
                    <button 
                        class="flex-1 btn btn-sm {showLogin ? 'btn-primary' : 'btn-ghost'}" 
                        onclick={() => showLogin = true}>
                        Sign In
                    </button>
                    <button 
                        class="flex-1 btn btn-sm {!showLogin ? 'btn-primary' : 'btn-ghost'}" 
                        onclick={() => showLogin = false}>
                        Register
                    </button>
                </div>
                
                <!-- Animated Content Area -->
                <div class="relative h-[320px] w-full overflow-hidden">
                    {#if showLogin}
                        <div class="absolute inset-0 w-full h-full" in:fly={{ x: -20, duration: 300, delay: 150 }} out:fly={{ x: 20, duration: 150 }}>
                            <Login isEmbedded={true} store={loginStore} />
                        </div>
                    {:else}
                        <div class="absolute inset-0 w-full h-full" in:fly={{ x: 20, duration: 300, delay: 150 }} out:fly={{ x: -20, duration: 150 }}>
                            <Register isEmbedded={true} store={registerStore} />
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>
