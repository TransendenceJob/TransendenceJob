
"use client";
import { useAuth } from "@/components/Providers";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { authClient} from "@/src/core/api/auth/auth.client";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            const timer = setTimeout(() => {
                router.push("/?showLogin=true");
            }, 10000);
            return () => clearTimeout(timer);
        }
// Check for when url changes if user is authenticated
        const verifyOnNavigate = async () => {
            const token = localStorage.getItem('accessToken');
            if (token && isAuthenticated) {
                await authClient.getMe(token);
            }
        };

        if (!isLoading && isAuthenticated) {
            void verifyOnNavigate();
        }
    }, [isLoading, isAuthenticated, router, pathname]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-pulse">
                <div className="w-16 h-16 border-4 border-zinc-200 border-t-blue-500 rounded-full animate-spin" />
                <h2 className="text-xl font-black uppercase tracking-tighter italic">
                    Establishing <span className="text-blue-500">Connection...</span>
                </h2>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col gap-8 py-24 max-w-5xl mx-auto px-6 items-center text-center">
                <div className="space-y-4">
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                        Security <br/>
                        <span className="text-red-500">Breach.</span>
                    </h2>
                    <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mx-auto">
                        This tactical zone is restricted. You must be an <strong>Authorized Operative</strong>{" "}
                        to access this environment.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                    <div className="px-6 py-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 font-mono text-sm shadow-sm">
                        STATUS: UNAUTHORIZED_ACCESS
                    </div>
                </div>

                <div className="pt-8 flex flex-col items-center gap-3">
                    <div className="w-5 h-5 border-2 border-zinc-300 border-t-red-500 rounded-full animate-[spin_2s_linear_infinite]" />
                    <p className="text-sm text-zinc-500">
                        Redirecting to safe zone...
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}