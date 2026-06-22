"use client";

import {useState} from "react";
import AuthModal from "./AuthModal";
import Image from "next/image";
import {useAuth} from "@/components/Providers";

export default function Header() {
    const [modalType, setModalType] = useState<'Login' | 'Register' | null>(null); // modaltype is a variable, and setModaltype a setter which can be called on click, null is the default state
    const { user, isAuthenticated, logout, isLoading } = useAuth();
    return (
        <header className="p-4 border-b border-foreground/10 grid grid-cols-3 items-center px-8">
            <div className="flex justify-start">
                <a href="/" className="hover:opacity-80 transition">
                    <Image
                        src="/catlogo3.jpg"
                        alt="Project Logo"
                        width={200}
                        height={200}
                        priority
                    />
                </a>
            </div>
            <div className="flex justify-center">
                <h1 className="font-black text-2xl tracking-tighter uppercase italic bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent">Ft_transcendence</h1>
            </div>
            <div className="flex justify-end pr-4">
                {isLoading ? (
                    <div className="h-8 w-8 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin" />
                ) : isAuthenticated ? (
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Active Operative</p>
                            <p className="text-sm font-black">{user?.email}</p>
                            <button
                                onClick={logout}
                                className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-tighter"
                            >
                                Terminate Session
                            </button>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-400 flex items-center justify-center text-white font-bold border-2 border-foreground/10 shadow-lg">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                    </div>
                ) : (
                    <nav className="flex flex-col items-end space-y-1">
                        <button
                            onClick={() => setModalType('Login')}
                            className="text-sm hover:text-blue-500 transition w-full text-center"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setModalType('Register')}
                            className="bg-foreground text-background px-4 py-1 rounded-full text-sm font-medium hover:opacity-90 transition"
                        >
                            Register
                        </button>
                    </nav>
                )}
            </div>

            <AuthModal
                isOpen={modalType !== null}
                onClose={() => setModalType(null)}
                type={modalType || 'Login'}
                setType={(t) => setModalType(t)}
            />
        </header>
    );
}