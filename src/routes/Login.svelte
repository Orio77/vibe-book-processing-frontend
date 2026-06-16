<script lang="ts">
    import { navigate } from '../lib/navigation';
    let { isEmbedded = false, onSwitch = () => {} }: { isEmbedded?: boolean, onSwitch?: () => void } = $props();
</script>

<div class="{isEmbedded ? 'w-full h-full' : 'card bg-base-100 shadow-xl border border-base-200 max-w-md mx-auto mt-16'}">
    <form class="card-body {isEmbedded ? 'pt-4' : ''}">
        <h2 class="card-title text-2xl font-bold">Sign in</h2>
        <p class="text-base-content/70 mb-4">Welcome back, please enter your email and password to sign in to your account.</p>
        <div class="form-control">
            <input id="login-email" type="email" placeholder="Email" class="input input-bordered focus:input-primary w-full" required />
        </div>
        <div class="form-control">
            <input id="login-password" type="password" placeholder="Password" class="input input-bordered focus:input-primary w-full" required />
        </div>
        <div class="form-control mt-4">
            <button class="btn btn-primary w-full" onclick={(e) => { e.preventDefault(); navigate('/library'); }}>Log In</button>
        </div>
        {#if !isEmbedded}
            <div class="text-center mt-4 text-sm text-base-content/70">
                Don't have an account? 
                <button type="button" class="link link-primary font-medium" onclick={() => navigate('/register')}>Sign up</button>
            </div>
        {/if}
    </form>
</div>
