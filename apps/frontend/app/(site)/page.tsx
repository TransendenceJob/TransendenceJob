"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/Providers";
import AuthModal from "@/components/AuthModal";
import BattleArena from "@/components/BattleArena";


function LandingPageContent() {
    const { isAuthenticated} = useAuth();
    const searchParams = useSearchParams();
    const showLogin = searchParams.get("showLogin");

    const [isAuthModalOpen, setAuthModalOpen] = useState(false);
    const [authType, setAuthType] = useState<'Login' | 'Register'>('Login');

    useEffect(() => {
        if (showLogin === "true" && !isAuthenticated) {
            setAuthType('Login');
            setAuthModalOpen(true);
        }
    }, [showLogin, isAuthenticated]);
    return (
        <div className="flex flex-col gap-16 py-12 max-w-5xl mx-auto px-6">

            {isAuthenticated && (
                <section className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <h2 className="text-2xl font-bold">Welcome back, {'Soldier'}!</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">Ready for another round of tactical mayhem?</p>
                </section>
            )}
            <section className="text-center sm:text-left space-y-6">
                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                    Tactical Mayhem, <br/>
                    <span className="text-blue-500">Reimagined.</span>
                </h2>
                <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    As part of the <strong>42 Transcendence</strong> project, our team at 42 Wolfsburg
                    has developed a fully functional, web-based artillery strategy game inspired by the
                    classic <em>Worms</em> franchise. Experience physics-based combat, destructible
                    environments, and real-time multiplayer action—all built from the ground up.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                    <h3 className="font-bold text-lg">Stack used:</h3>
                    <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-sm font-mono">
                        Next.js
                    </div>
                    <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-sm font-mono">
                        Tailwind CSS
                    </div>
                    <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-sm font-mono">
                        BabylonJs
                    </div>
                    <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-sm font-mono">
                        Microservices
                    </div>
                </div>
            </section>

            {isAuthenticated ? (
                <section className="flex flex-col flex-grow overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl border border-foreground/10 shadow-sm">

                    {/* Header */}
                    <div className="p-4 border-b border-foreground/5 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <h3 className="text-xl font-bold tracking-wide italic">
                                BATTLE ARENA
                            </h3>
                        </div>

                        <span className="text-[10px] font-mono opacity-50">
                READY
            </span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-6">
                        <div className="text-center space-y-3 mb-6 max-w-md">
                            <h2 className="text-2xl font-bold">
                                Enter the Battle Arena
                            </h2>
                            <p className="text-sm opacity-60">
                                Click launch to enter a real-time match and compete against other players.
                            </p>
                        </div>

                        <div className="w-full max-w-md">
                            <BattleArena border={false} dashed={false}/>
                        </div>
                    </div>

                </section>
                ) : (
            /* 2. Video Placeholder Section */
            <section className="w-full">
                <div
                    className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center group hover:border-blue-500 transition-colors">
                    {/* This icon and text will show until you replace it with a <video> tag */}
                    <div className="flex flex-col items-center gap-4 text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                             stroke="currentColor" className="w-12 h-12 group-hover:scale-110 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z"/>
                        </svg>
                        <p className="font-medium">Gameplay Demo Coming Soon</p>
                    </div>

                    {/* add Video later
              <video 
                controls 
                className="w-full h-full object-cover"
                poster="/thumbnail.png"
              >
                <source src="/demo-video.mp4" type="video/mp4" />
              </video> 
          */}
                </div>
            </section>
)}
            <section className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <h3 className="font-bold text-lg">Real-Time Multiplayer</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">Low-latency networking using WebSockets for seamless
                        turn-based combat between players across the globe.</p>
                </div>
                <div className="space-y-2">
                    <h3 className="font-bold text-lg">Dynamic Physics</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">Custom physics engine handling projectile
                        trajectories, wind resistance, and gravity-defying maneuvers.</p>
                </div>
            </section>
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setAuthModalOpen(false)}
                type={authType}
                setType={setAuthType}
            />
        </div>
    );
}

export default function LandingPage() {
    return (
        <Suspense fallback={null}>
            <LandingPageContent />
        </Suspense>
    );
}