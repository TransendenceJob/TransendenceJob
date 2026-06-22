
"use client";
import { useAuth } from "@/components/Providers";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { authClient} from "@/src/core/api/auth/auth.client";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const hasRoleClearance = !allowedRoles ||
        (user?.roles && allowedRoles.some(role => user.roles.includes(role)));

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            const timer = setTimeout(() => {
                const encodedPath = encodeURIComponent(pathname);
                router.push(`/?showLogin=true&callbackUrl=${encodedPath}`);
            }, 5000);
            return () => clearTimeout(timer);
        }

        if (isAuthenticated && !hasRoleClearance) {
            const timer = setTimeout(() => {
                router.push("/homepage");
            }, 5000); //
            return () => clearTimeout(timer);
        }
// Check for when url changes if user is authenticated
        const verifyOnNavigate = async () => {
            const token = sessionStorage.getItem('auth.accessToken');
            if (token && isAuthenticated) {
                await authClient.getMe();
            }
        };

        if (isAuthenticated && hasRoleClearance) {
            void verifyOnNavigate();
        }
    }, [isLoading, isAuthenticated, hasRoleClearance, router, pathname]);

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

    if (!isAuthenticated || !hasRoleClearance) {
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
                        STATUS: {!isAuthenticated ? 'UNAUTHORIZED_ACCESS' : 'INSUFFICIENT_CLEARANCE'}
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