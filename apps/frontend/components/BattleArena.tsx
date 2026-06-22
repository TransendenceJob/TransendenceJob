"use client";

import { useRouter } from "next/navigation";

export default function BattleArena({className = "", border = true, dashed = true }) {
    const router = useRouter();

    const handleLaunch = () => {
        router.push("/game");
    };

    return (
        <div className={`flex-[2] relative rounded-3xl flex flex-col items-center justify-center overflow-hidden group
                ${border ? "border-2 border-zinc-300 dark:border-zinc-800" : ""}
                ${dashed ? "border-dashed" : ""}
                ${className}`}>
            <button
                onClick={handleLaunch}
                className="px-8 py-3 bg-foreground text-background rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform active:scale-95"
            >
                Launch Game
            </button>
        </div>
    );
}