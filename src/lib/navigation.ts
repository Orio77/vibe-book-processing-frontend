import { navigate as svelteNavigate } from 'svelte-routing';
import { flushSync } from 'svelte';

export function navigate(to: string, options?: { replace?: boolean, state?: any }) {
    if (!document.startViewTransition) {
        svelteNavigate(to, options);
        return;
    }

    document.startViewTransition(() => {
        flushSync(() => {
            svelteNavigate(to, options);
        });
    });
}
