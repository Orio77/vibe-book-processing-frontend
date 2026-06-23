import { isAuthenticated, clearAuthToken, getAuthenticatedEmail } from '$lib/api/core/authToken';
import { navigate } from '$lib/navigation';

class AuthStore {
    loggedIn = $state(isAuthenticated());
    email = $state(getAuthenticatedEmail());

    refresh() {
        this.loggedIn = isAuthenticated();
        this.email = getAuthenticatedEmail();
    }

    logout() {
        clearAuthToken();
        this.loggedIn = false;
        this.email = null;
        navigate('/');
    }
}

export const authStore = new AuthStore();
