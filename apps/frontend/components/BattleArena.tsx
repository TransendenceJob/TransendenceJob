"use client";

import { useRouter } from "next/navigation";

export default function BattleArena() {
    const router = useRouter();

    const handleLaunch = () => {
        router.push("/game");
    };

    return (
        <div className="flex-[2] relative rounded-3xl bg-zinc-100 dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-800 flex flex-col items-center justify-center overflow-hidden group">
            <button
                onClick={handleLaunch}
                className="px-8 py-3 bg-foreground text-background rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform active:scale-95"
            >
                Launch Game
            </button>
        </div>
    );
}