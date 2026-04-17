"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserAuthView} from "@/src/core/api/auth/auth.types";
import {authClient} from "@/src/core/api/auth/auth.client";

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

    useEffect(() => {
        const bootstrapSession = async () => {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const result = await authClient.getMe(token);
                if (result.ok) {
                    setUser(result.data.user);
                } else {
                    localStorage.removeItem('accessToken'); // will be replaced be refresh call
                }
            } catch (error) {
                console.error("Bootstrap failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        bootstrapSession();
    }, []);

    const logout = async () => {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        try {
            if (accessToken && refreshToken) {
                await authClient.logout({ refreshToken }, accessToken);
            }
        } catch (error) {
            console.error("Server-side logout failed", error);
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setUser(null);
        }
    };
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