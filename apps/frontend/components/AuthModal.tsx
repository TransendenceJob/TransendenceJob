"use client";

import { useRouter } from "next/navigation"; //used for placeholder
import {useEffect, useState} from "react";
import {authClient} from "@/src/core/api/auth/auth.client";

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
    const router = useRouter(); // for placeholder
    const [googleLoading, setGoogleLoading] = useState(false);
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log("Redirecting to homepage...");

        onClose();
        router.push("/homepage"); // redirect to homepage
    };

    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);
            window.location.assign("/api/auth/google/start");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Google authentication failed";
            alert(message);
        } finally {
            setGoogleLoading(false);
        }
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
                    <p className="text-sm text-zinc-500 mt-2">
                        {type === 'Login' ? 'Welcome back, You little worm!' : 'Join the tactical mayhem.'}
                    </p>
                </div>
                {/*<form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}> /!* prevent refresh of the whole page*!/*/}
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}> {/* trigger placeholder */}
                    <input type="email" placeholder="Email Address" autoComplete="email"
                           className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>

                    {type === 'Register' && (
                        <input type="email" placeholder="Confirm Email Address"
                               className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
                    )}

                    <input type="password" placeholder="Password" autoComplete="current-password"
                           className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>

                    {type === 'Register' && (
                        <input type="password" placeholder="Confirm Password"
                               className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
                    )}

                    <button
                        className="bg-foreground text-background py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all mt-2">
                        {type === 'Login' ? 'Sign In' : 'Create Account'}
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