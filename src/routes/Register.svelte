<script lang="ts">
    import { navigate } from '../lib/navigation';
    import { createRegisterStore, type RegisterStore } from '$lib/stores/register.svelte';

    let { isEmbedded = false, onSwitch = () => {}, store }: { isEmbedded?: boolean, onSwitch?: () => void, store?: RegisterStore } = $props();

    const register = store ?? createRegisterStore();
</script>

<div class="{isEmbedded ? 'w-full h-full' : 'card bg-base-100 shadow-xl border border-base-200 max-w-md mx-auto mt-16'}">
    <div class="card-body {isEmbedded ? 'pt-4' : ''}">
        <h2 class="card-title text-2xl font-bold justify-center mb-4">Create an Account</h2>
        
        {#if register.errorMsg}
            <div class="alert alert-error text-sm p-3 mb-4 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{register.errorMsg}</span>
            </div>
        {/if}

        <form onsubmit={register.handleRegister}>
            <div class="form-control">
                <label class="label" for="register-email"><span class="label-text font-medium">Email</span></label>
                <input id="register-email" type="email" placeholder="email@example.com" class="input input-bordered focus:input-primary w-full" bind:value={register.email} required disabled={register.isSubmitting} />
            </div>
            <div class="form-control mt-2">
                <label class="label" for="register-password"><span class="label-text font-medium">Password</span></label>
                <input id="register-password" type="password" placeholder="Password" class="input input-bordered focus:input-primary w-full" bind:value={register.password} required disabled={register.isSubmitting} />
            </div>
            <div class="form-control mt-4">
                <button class="btn btn-primary w-full" type="submit" disabled={register.isSubmitting}>
                    {#if register.isSubmitting}
                        <span class="loading loading-spinner loading-sm"></span>
                    {/if}
                    Register
                </button>
            </div>
        </form>
        {#if !isEmbedded}
            <div class="text-center mt-4 text-sm text-base-content/70">
                Already have an account? 
                <button type="button" class="link link-primary font-medium" onclick={() => navigate('/login')}>Log in</button>
            </div>
        {/if}
    </div>
</div>
