"use client";

import { useRouter } from "next/navigation"; //used for placeholder
import {useState} from "react";
import {authClient} from "@/src/core/api/auth/auth.client";
import {useAuth} from "@/components/Providers";

const validateForm = (
    formData: FormData,
    type: "Login" | "Register"
): string | null => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (type === "Register") {
        const confirmEmail = formData.get("confirmEmail") as string;
        const confirmPassword = formData.get("confirmPassword") as string;
        // pre validation browser side
        if (email !== confirmEmail) return "Emails do not match!";
        if (password !== confirmPassword) return "Passwords do not match!";
    }

    return null;
};

export default function AuthModal({
                                      isOpen,
                                      onClose,
                                      type,
                                      setType
                                  }: {
    isOpen: boolean;
    onClose: () => void;
    type: 'Login' | 'Register'
    setType: (type: 'Login' | 'Register') => void;
}) {
    const router = useRouter();
    const {setUser, isAuthenticated} = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [googleLoading, setGoogleLoading] = useState(false);
    if (!isOpen || isAuthenticated) return null;

    const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();

        if (isSubmitting) return; // prevent double submit second guard

        setErrorMessage(null);

        const formData = new FormData(e.currentTarget);
        const error = validateForm(formData, type);
        if (error){
            setErrorMessage(error);
            return;
        }

        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        setIsSubmitting(true);
        try {
            const result = await (type === 'Login'
                ? authClient.login({ email, password })
                : authClient.register({ email, password }));

            if (!result.ok) {
                setErrorMessage(result.error.message);
                return;
            }
            localStorage.setItem('accessToken', result.data.tokens.accessToken);
            localStorage.setItem('refreshToken', result.data.tokens.refreshToken);
            setUser(result.data.user);
            onClose();
            router.push("/homepage");
        } catch {
            setErrorMessage("Connection failed. Please check your internet.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        authClient.startGoogleOAuth();
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-2xl w-full max-w-md relative border border-foreground/5">
                <button onClick={onClose}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-foreground transition-colors">✕
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black tracking-tight">{type}</h2>
                    {errorMessage && (
                        <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold border border-red-100 dark:border-red-800">
                            {errorMessage}
                        </div>
                    )}
                    <p className="text-sm text-zinc-500 mt-2">
                        {type === 'Login' ? 'Welcome back, You little worm!' : 'Join the tactical mayhem.'}
                    </p>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    {/* Email Input */}
                    <input name="email" type="email" placeholder="Email Address" required autoComplete="email" disabled={isSubmitting}
                           className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>

                    {type === 'Register' && (
                        <input name="confirmEmail" type="email" placeholder="Confirm Email Address" required disabled={isSubmitting}
                               className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
                    )}
                    {/* Password Input */}
                    <input name="password" type="password" placeholder="Password" autoComplete={type === 'Login' ? "current-password" : "new-password"} required disabled={isSubmitting}
                           className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>

                    {type === 'Register' && (
                        <input name="confirmPassword" type="password" placeholder="Confirm Password" required disabled={isSubmitting}
                               className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="relative bg-foreground text-background py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all mt-2 flex items-center justify-center min-h-[48px]"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                <span>Processing...</span>
                            </div>
                        ) : (
                            type === 'Login' ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </form>

                <button
                    onClick={handleGoogleLogin}
                    type="button"
                    disabled={googleLoading}
                    className="w-full mt-4 flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
                >
                    <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-5 h-5" />
                    {googleLoading ? "Connecting..." : "Continue with Google"}
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-zinc-800"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">Or continue with email</span></div>
                </div>
                <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                    <p className="text-sm text-zinc-500">
                        {type === 'Login' ? "Don't have an account?" : "Already have an account?"}
                    </p>
                    <button
                        onClick={() => setType(type === 'Login' ? 'Register' : 'Login')}
                        className="mt-2 text-blue-500 font-bold hover:underline underline-offset-4"
                    >
                        {type === 'Login' ? 'Create an account' : 'Log in here'}
                    </button>
                </div>
            </div>
        </div>
    );
}