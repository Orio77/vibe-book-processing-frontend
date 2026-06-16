<script lang="ts">
    import Layout from './components/layout/Layout.svelte';
    import Landing from './routes/Landing.svelte';
    import Login from './routes/Login.svelte';
    import Register from './routes/Register.svelte';
    import Library from './routes/Library.svelte';
    import Upload from './routes/Upload.svelte';

    // Basic routing state for now (no router configured yet)
    let currentRoute = $state('landing');

    function navigate(route: string) {
        currentRoute = route;
    }
</script>

<Layout showNavbar={currentRoute !== 'landing'} {currentRoute} {navigate}>
    <!-- Temporary dev navigation controls -->
    <div class="flex justify-center gap-2 mb-8 p-2 bg-base-200 rounded-lg">
        <span class="text-xs font-bold self-center uppercase mr-2 text-base-content/50">Dev Nav:</span>
        <button class="btn btn-xs {currentRoute === 'landing' ? 'btn-primary' : 'btn-ghost'}" onclick={() => navigate('landing')}>Landing</button>
        <button class="btn btn-xs {currentRoute === 'login' ? 'btn-primary' : 'btn-ghost'}" onclick={() => navigate('login')}>Login</button>
        <button class="btn btn-xs {currentRoute === 'register' ? 'btn-primary' : 'btn-ghost'}" onclick={() => navigate('register')}>Register</button>
        <button class="btn btn-xs {currentRoute === 'library' ? 'btn-primary' : 'btn-ghost'}" onclick={() => navigate('library')}>Library</button>
        <button class="btn btn-xs {currentRoute === 'upload' ? 'btn-primary' : 'btn-ghost'}" onclick={() => navigate('upload')}>Upload</button>
    </div>

    {#if currentRoute === 'landing'}
        <Landing {navigate} />
    {:else if currentRoute === 'login'}
        <Login {navigate} />
    {:else if currentRoute === 'register'}
        <Register {navigate} />
    {:else if currentRoute === 'library'}
        <Library {navigate} />
    {:else if currentRoute === 'upload'}
        <Upload {navigate} />
    {/if}
</Layout>
