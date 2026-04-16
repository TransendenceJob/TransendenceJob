"use client";

import React, { createContext, useContext, useState } from "react";
import { UserAuthView} from "@/src/core/api/auth/auth.types";

interface AuthContextType {
    user: UserAuthView | null;
    setUser: (user: UserAuthView | null) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function Providers({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserAuthView | null>(null);

    const isAuthenticated = !!user;
    // Provides global auth state (user, setter, and auth status) to all child components
    return (
        <AuthContext.Provider value = {{user, setUser, isAuthenticated}}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within a Providers component");
    return context;
};