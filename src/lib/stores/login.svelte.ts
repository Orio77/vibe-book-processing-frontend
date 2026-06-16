import { loginUser } from '$lib/api/features/auth';
import { navigate } from '$lib/navigation';
import { authStore } from '$lib/stores/auth.svelte';

export class LoginStore {
    email = $state('');
    password = $state('');
    isSubmitting = $state(false);
    errorMsg = $state('');

    handleLogin = async (e: Event) => {
        e.preventDefault();
        this.errorMsg = '';
        this.isSubmitting = true;
        
        try {
            await loginUser({ email: this.email, password: this.password });
            authStore.refresh();
            navigate('/library');
        } catch (e: any) {
            console.error("Login failed", e);
            this.errorMsg = e.response?.data?.message || e.message || 'Login failed. Please check your credentials.';
        } finally {
            this.isSubmitting = false;
        }
    };
}

export function createLoginStore() {
    return new LoginStore();
}
