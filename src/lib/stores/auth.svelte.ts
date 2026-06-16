import { isAuthenticated, clearAuthToken } from '$lib/api/core/authToken';
import { navigate } from '$lib/navigation';

class AuthStore {
    loggedIn = $state(isAuthenticated());

    refresh() {
        this.loggedIn = isAuthenticated();
    }

    logout() {
        clearAuthToken();
        this.loggedIn = false;
        navigate('/');
    }
}

export const authStore = new AuthStore();
