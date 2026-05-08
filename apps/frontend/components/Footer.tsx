"use client";

import Link from "next/link";
import { useAuth } from "@/components/Providers";
import { useRouter } from "next/navigation";

export default function Footer() {
    const { user } = useAuth();
    const router = useRouter();

    const handleProfileClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (user?.id) {
            router.push(`/profile/${user.id}`);
            return;
        }

        const next = encodeURIComponent(`/profile/${user?.id ?? ''}`);
        router.push(`/?showLogin=true&next=${next}`);
    };

    return (
        <footer className="p-8 border-t border-foreground/10 text-center">
            <div className="flex justify-center space-x-6 mb-4 text-sm text-zinc-500">
                <Link href="/policy" className="hover:text-foreground transition">
                    Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-foreground transition">
                    Terms of Service
                </Link>
                <Link href="/about" className="hover:text-foreground transition">
                    Meet the Team
                </Link>
                <Link href={user?.id ? `/profile/${user.id}` : '/'} onClick={handleProfileClick} className="hover:text-foreground transition">
                    User profile
                </Link>
            </div>
            <p className="text-xs text-zinc-400">
                © 2026 Ft_transcendence. Built at 42 Wolfsburg.
            </p>
        </footer>
    );
}