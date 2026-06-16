<script lang="ts">
    import { Router, Route } from "svelte-routing";
    import { navigate } from "./lib/navigation";
    import Layout from "./components/layout/Layout.svelte";
    import Landing from "./routes/Landing.svelte";
    import Login from "./routes/Login.svelte";
    import Register from "./routes/Register.svelte";
    import Library from "./routes/Library.svelte";
    import Upload from "./routes/Upload.svelte";
    import Reader from "./routes/Reader.svelte";

    export let url = "";
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
