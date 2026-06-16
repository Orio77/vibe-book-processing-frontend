<script lang="ts">
    import { Router, Route } from 'svelte-routing';
    import { navigate } from './lib/navigation';
    import Layout from './components/layout/Layout.svelte';
    import Landing from './routes/Landing.svelte';
    import Login from './routes/Login.svelte';
    import Register from './routes/Register.svelte';
    import Library from './routes/Library.svelte';
    import Upload from './routes/Upload.svelte';

    export let url = "";
</script>

<Router {url}>
    <Layout>
        <!-- Temporary dev navigation controls -->
        <div class="flex justify-center gap-2 mb-8 p-2 bg-base-200 rounded-lg">
            <span class="text-xs font-bold self-center uppercase mr-2 text-base-content/50">Dev Nav:</span>
            <button class="btn btn-xs btn-ghost" onclick={() => navigate('/')}>Landing</button>
            <button class="btn btn-xs btn-ghost" onclick={() => navigate('/login')}>Login</button>
            <button class="btn btn-xs btn-ghost" onclick={() => navigate('/register')}>Register</button>
            <button class="btn btn-xs btn-ghost" onclick={() => navigate('/library')}>Library</button>
            <button class="btn btn-xs btn-ghost" onclick={() => navigate('/upload')}>Upload</button>
        </div>

        <Route path="/"><Landing /></Route>
        <Route path="/login"><Login /></Route>
        <Route path="/register"><Register /></Route>
        <Route path="/library"><Library /></Route>
        <Route path="/upload"><Upload /></Route>
    </Layout>
</Router>
