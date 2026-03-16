"use client";

import {useState} from "react";
import AuthModal from "./AuthModal";
import Image from "next/image";

export default function Header() {
    const [modalType, setModalType] = useState<'Login' | 'Register' | null>(null); // modaltype is a variable, and setModaltype a setter which can be called on lick, null is the default state

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
                <nav className="flex flex-col space-y-1">
                    <button
                        onClick={() => setModalType('Login')}
                        className="text-sm hover:text-blue-500 transition"
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