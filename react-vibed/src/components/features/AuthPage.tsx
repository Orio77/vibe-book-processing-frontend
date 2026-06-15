import type React from 'react';
import { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Loader2 } from 'lucide-react';
import { ErrorAlert } from '@/components/ui';
import {
    getApiErrorMessage,
    isAuthenticated,
    loginUser,
    registerUser,
} from '@/lib/api';
import { ROUTES } from '@/lib/constants';

export interface AuthPageProps {
    readonly mode: 'login' | 'register';
}

export default function AuthPage({ mode }: AuthPageProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const redirectTarget = useMemo(() => {
        const state = location.state as { from?: string } | null;
        const from = state?.from?.trim();
        if (!from) {
            return ROUTES.HOME;
        }

        if (from === ROUTES.UPLOAD) {
            return ROUTES.HOME;
        }

        return from;
    }, [location.state]);

    if (isAuthenticated()) {
        return <Navigate to={redirectTarget} replace />;
    }

    const isLoginMode = mode === 'login';

    const switchMode = () => {
        navigate(isLoginMode ? ROUTES.AUTH_REGISTER : ROUTES.AUTH_LOGIN, {
            replace: true,
            state: { from: redirectTarget },
        });
    };

    const onSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError('Email is required.');
            return;
        }

        if (!password) {
            setError('Password is required.');
            return;
        }

        setError(null);
        setMessage(null);
        setSubmitting(true);

        try {
            if (isLoginMode) {
                await loginUser({ email: trimmedEmail, password });
                navigate(redirectTarget, { replace: true });
                return;
            }

            const token = await registerUser({ email: trimmedEmail, password });
            if (token) {
                navigate(redirectTarget, { replace: true });
                return;
            }

            setMessage('Registration successful. Please login to continue.');
            navigate(ROUTES.AUTH_LOGIN, {
                replace: true,
                state: { from: redirectTarget },
            });
        } catch (submitError) {
            setError(
                getApiErrorMessage(
                    submitError,
                    isLoginMode ? 'Failed to login' : 'Failed to register',
                ),
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto mt-10 w-full max-w-md sm:mt-16">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-center justify-center gap-2 text-slate-900">
                    <div className="rounded-lg bg-blue-600 p-1.5">
                        <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">BookProcessing</span>
                </div>

                <h1 className="text-center text-2xl font-bold text-slate-900">
                    {isLoginMode ? 'Sign in' : 'Create account'}
                </h1>
                <p className="mt-2 text-center text-sm text-slate-500">
                    {isLoginMode
                        ? 'Login to access your PDF library.'
                        : 'Register to start uploading and processing books.'}
                </p>

                <div className="mt-6">
                    {error && <ErrorAlert message={error} />}
                    {message && (
                        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            {message}
                        </p>
                    )}
                </div>

                <form className="space-y-4" onSubmit={onSubmit}>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        autoComplete="email"
                        disabled={submitting}
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                        disabled={submitting}
                    />

                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isLoginMode ? 'Signing in...' : 'Creating account...'}
                            </>
                        ) : (
                            <>{isLoginMode ? 'Sign in' : 'Create account'}</>
                        )}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={switchMode}
                    disabled={submitting}
                    className="mt-4 w-full text-center text-sm font-medium text-blue-700 hover:text-blue-900 disabled:text-blue-400"
                >
                    {isLoginMode ? 'Need an account? Register' : 'Already have an account? Sign in'}
                </button>
            </div>
        </div>
    );
}