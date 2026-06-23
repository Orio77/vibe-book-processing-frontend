import { loginUser, registerUser } from '$lib/api/features/auth';
import { navigate } from '$lib/navigation';
import { authStore } from '$lib/stores/auth.svelte';

export class RegisterStore {
    email = $state('');
    password = $state('');
    isSubmitting = $state(false);
    errorMsg = $state('');

    handleRegister = async (e: Event) => {
        e.preventDefault();
        this.errorMsg = '';
        this.isSubmitting = true;

        try {
            await registerUser({ email: this.email, password: this.password });
            await loginUser({ email: this.email, password: this.password });
            authStore.refresh();
            navigate('/library');
        } catch (e: any) {
            console.error("Registration failed", e);
            this.errorMsg = 'Registration failed. Please try again.';
        } finally {
            this.isSubmitting = false;
        }
    };
}

export function createRegisterStore() {
    return new RegisterStore();
}
