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
            const status = e.response?.status;
            if (status === 401) {
                this.errorMsg = 'Incorrect email or password. Please try again.';
            } else if (status === 400) {
                this.errorMsg = 'Please check your input. Password must be at least 6 characters.';
            } else {
                console.error(e.response?.data || e.message);
                this.errorMsg = 'Login failed. Please try again later.';
            }
        } finally {
            this.isSubmitting = false;
        }
    };
}

export function createLoginStore() {
    return new LoginStore();
}
