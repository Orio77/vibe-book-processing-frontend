<script lang="ts">
    import { onMount } from "svelte";
    import { Router, Route } from "svelte-routing";
    import { navigate } from "./lib/navigation";
    import Layout from "./components/layout/Layout.svelte";
    import Landing from "./routes/Landing.svelte";
    import Login from "./routes/Login.svelte";
    import Register from "./routes/Register.svelte";
    import Library from "./routes/Library.svelte";
    import Upload from "./routes/Upload.svelte";
    import Reader from "./routes/Reader.svelte";
    import { setAuthToken } from "./lib/api/core/authToken";
    import { authStore } from "./lib/stores/auth.svelte";

    export let url = "";

    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (token) {
            setAuthToken(token);
            authStore.refresh();

            window.history.replaceState({}, document.title, "/");
            navigate("/library");

            console.log("Successfully logged in via OAuth!");
        }
    });
</script>

<Router {url}>
    <Layout>
        <Route path="/"><Landing /></Route>
        <Route path="/login"><Login /></Route>
        <Route path="/register"><Register /></Route>
        <Route path="/library"><Library /></Route>
        <Route path="/upload"><Upload /></Route>
        <Route path="/read/:id" let:params><Reader id={params.id} /></Route>
    </Layout>
</Router>
