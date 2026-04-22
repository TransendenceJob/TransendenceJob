"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthModal from "@/components/AuthModal";

function LandingPageContent() {
    const searchParams = useSearchParams();
    const showLogin = searchParams.get("showLogin");

    const [isAuthModalOpen, setAuthModalOpen] = useState(false);
    const [authType, setAuthType] = useState<'Login' | 'Register'>('Login');

    useEffect(() => {
        if (showLogin === "true") {
            setAuthType('Login');
            setAuthModalOpen(true);
        }
    }, [showLogin]);
    return (
        <div className="flex flex-col gap-16 py-12 max-w-5xl mx-auto px-6">

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

            {/* 2. Video Placeholder Section */}
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