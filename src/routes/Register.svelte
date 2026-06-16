<script lang="ts">
    let { navigate, isEmbedded = false, onSwitch = () => {} }: { navigate: (route: string) => void, isEmbedded?: boolean, onSwitch?: () => void } = $props();
</script>

<div class="{isEmbedded ? 'w-full h-full' : 'card bg-base-100 shadow-xl border border-base-200 max-w-md mx-auto mt-16'}">
    <form class="card-body {isEmbedded ? 'pt-4' : ''}">
        <h2 class="card-title text-2xl font-bold">Create Account</h2>
        <p class="text-base-content/70 mb-4">Enter your email and password to create an account.</p>
        <div class="form-control">
            <input id="register-email" type="email" placeholder="Email" class="input input-bordered focus:input-primary w-full" required />
        </div>
        <div class="form-control">
            <input id="register-password" type="password" placeholder="Password" class="input input-bordered focus:input-primary w-full" required />
        </div>
        <div class="form-control mt-4">
            <button class="btn btn-primary w-full" onclick={(e) => { e.preventDefault(); navigate('library'); }}>Register</button>
        </div>
        {#if !isEmbedded}
            <div class="text-center mt-4 text-sm text-base-content/70">
                Already have an account? 
                <button type="button" class="link link-primary font-medium" onclick={() => navigate('login')}>Log in</button>
            </div>
        {/if}
    </form>
</div>
