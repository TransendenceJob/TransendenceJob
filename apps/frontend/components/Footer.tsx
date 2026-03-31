import Link from "next/link";

export default function Footer() {
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
                <Link href="/userprofile" className="hover:text-foreground transition">
                    User profile
                </Link>
            </div>
            <p className="text-xs text-zinc-400">
                © 2026 Ft_transcendence. Built at 42 Wolfsburg.
            </p>
        </footer>
    );
}