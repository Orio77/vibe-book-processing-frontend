<script lang="ts">
    import { navigate } from '../lib/navigation';
    import { createLoginStore, type LoginStore } from '$lib/stores/login.svelte';

    let { isEmbedded = false, onSwitch = () => {}, store }: { isEmbedded?: boolean, onSwitch?: () => void, store?: LoginStore } = $props();

    const login = store ?? createLoginStore();
</script>

<div class="{isEmbedded ? 'w-full h-full' : 'card bg-base-100 shadow-xl border border-base-200 max-w-md mx-auto mt-16'}">
    <div class="card-body {isEmbedded ? 'pt-4' : ''}">
        <h2 class="card-title text-2xl font-bold justify-center mb-4">Welcome Back</h2>
        
        {#if login.errorMsg}
            <div class="alert alert-error text-sm p-3 mb-4 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{login.errorMsg}</span>
            </div>
        {/if}

        <form onsubmit={login.handleLogin}>
            <div class="form-control">
                <label class="label" for="login-email"><span class="label-text font-medium">Email</span></label>
                <input id="login-email" type="email" placeholder="email@example.com" class="input input-bordered focus:input-primary w-full" bind:value={login.email} required disabled={login.isSubmitting} />
            </div>
            <div class="form-control mt-2">
                <label class="label" for="login-password"><span class="label-text font-medium">Password</span></label>
                <input id="login-password" type="password" placeholder="Password" class="input input-bordered focus:input-primary w-full" bind:value={login.password} required disabled={login.isSubmitting} />
            </div>
            <div class="form-control mt-4">
                <button class="btn btn-primary w-full" type="submit" disabled={login.isSubmitting}>
                    {#if login.isSubmitting}
                        <span class="loading loading-spinner loading-sm"></span>
                    {/if}
                    Log In
                </button>
            </div>
        </form>
        {#if !isEmbedded}
            <div class="text-center mt-4 text-sm text-base-content/70">
                Don't have an account? 
                <button type="button" class="link link-primary font-medium" onclick={() => navigate('/register')}>Sign up</button>
            </div>
        {/if}
    </div>
</div>
