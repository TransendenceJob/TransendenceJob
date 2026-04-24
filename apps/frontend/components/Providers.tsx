"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserAuthView} from "@/src/core/api/auth/auth.types";
import {authClient} from "@/src/core/api/auth/auth.client";
import {useRouter} from "next/navigation";

interface AuthContextType {
    user: UserAuthView | null;
    setUser: (user: UserAuthView | null) => void;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function Providers({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserAuthView | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // useCallBack prevents rerun every react render
    const logout = useCallback(async () => {
        const accessToken = sessionStorage.getItem("auth.accessToken");
        const refreshToken = sessionStorage.getItem("auth.refreshToken");

        try {
            if (accessToken && refreshToken) {
                await authClient.logout({ refreshToken });
            }
        } catch (error) {
            console.error("Server-side logout failed", error);
        } finally {
            sessionStorage.removeItem("auth.accessToken");
            sessionStorage.removeItem("auth.refreshToken");
            sessionStorage.removeItem("auth.expiresIn");
            sessionStorage.removeItem("auth.tokenType");

            setUser(null);
            router.push("/");
        }
    }, [router]);

    // run once on startup
    useEffect(() => {
        const bootstrapSession = async () => {
            const token = sessionStorage.getItem('auth.accessToken');

            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const result = await authClient.getMe();

                if (result.ok) {
                    setUser(result.data.user);
                } else {
                    sessionStorage.removeItem('auth.accessToken');
                    sessionStorage.removeItem('auth.refreshToken');
                }
            } catch (error) {
                console.error("Bootstrap failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        void bootstrapSession();
    }, []);

    // auto cleanup when cookies expire
    useEffect(() => {
        const handleUnauthorized = () => {
            console.warn("Session expired or unauthorized. Performing cleanup...");
            void logout();
        };

        window.addEventListener("auth-unauthorized", handleUnauthorized);
        return () => window.removeEventListener("auth-unauthorized", handleUnauthorized);
    }, [logout]);

    const isAuthenticated = !!user;
    // Provides global auth state (user, setter, and auth status) to all child components
    return (
        <AuthContext.Provider value = {{user, setUser, logout, isAuthenticated, isLoading}}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within a Providers component");
    return context;
};