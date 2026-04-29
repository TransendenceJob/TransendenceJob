"use client";

import {useState} from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

type TabType = 'Info' | 'Friends' | 'Clan' | 'Invitations';

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<TabType>('Info');

    const tabs: { name: TabType; icon: string }[] = [
        {name: 'Info', icon: '👤'},
        {name: 'Friends', icon: '👥'},
        {name: 'Clan', icon: '🛡️'},
        {name: 'Invitations', icon: '✉️'},
    ];

    return (
        <ProtectedRoute>
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[
                    {label: "Matches", value: "142", color: "text-blue-500"},
                    {label: "Win Rate", value: "64%", color: "text-green-500"},
                    {label: "K/D Ratio", value: "2.1", color: "text-red-500"},
                    {label: "Kills", value: "500", color: "text-green-500"},
                    {label: "Deaths", value: "42", color: "text-red-500"},
                ].map((stat) => (
                    <div key={stat.label}
                         className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-2xl border border-foreground/5">
                        <p className="text-[10px] uppercase font-bold text-zinc-500">{stat.label}</p>
                        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>
            <div className="flex flex-col md:flex-row gap-8">

                {/* LEFT: Sidebar Navigation */}
                <div className="w-full md:w-64 flex flex-col gap-2">
                    <div className="p-6 mb-4 bg-zinc-100 dark:bg-zinc-900 rounded-3xl text-center">
                        <div
                            className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl border-4 border-white dark:border-zinc-800 shadow-lg">
                            🪱
                        </div>
                        <h2 className="font-black text-xl">WormMaster_42</h2>
                        <p className="text-xs text-zinc-500 font-mono uppercase">Level 15 Recruit</p>
                    </div>

                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                                activeTab === tab.name
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                                    : "bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* RIGHT: Content Display Area */}
                <div
                    className="flex-grow min-h-[400px] bg-white dark:bg-zinc-900 border border-foreground/5 rounded-3xl p-8 shadow-sm">
                    <h3 className="text-2xl font-black mb-6 border-b pb-4 border-foreground/5">
                        {activeTab}
                    </h3>

                    <div className="space-y-4">

                        {activeTab === 'Info' && (
                            <div className="grid gap-4">
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                    <label className="text-[10px] uppercase font-bold text-zinc-400">Email
                                        Address</label>
                                    <p className="font-medium">worm_commander@42wolfsburg.de</p>
                                </div>
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                    <label className="text-[10px] uppercase font-bold text-zinc-400">Total
                                        Victories</label>
                                    <p className="font-medium">128 Matches Won</p>
                                </div>
                                <div className="mt-8">
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Achievements</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {['🎯 Sharp Shooter', '🔥 10 Win Streak', '🛡️ Clan Founder', '🧪 Beta Tester'].map((badge) => (
                                            <span key={badge}
                                                  className="px-3 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20 rounded-full text-xs font-bold">
        {badge}
      </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Friends' && (
                            <div className="text-center py-12 text-zinc-500 italic">
                                You haven't added any battle buddies yet.
                            </div>
                        )}

                        {activeTab === 'Clan' && (
                            <div
                                className="p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
                                <p className="text-zinc-500">You are not currently in a Clan.</p>
                                <button className="mt-4 text-blue-500 font-bold hover:underline">Create a Clan +
                                </button>
                            </div>
                        )}

                        {activeTab === 'Invitations' && (
                            <div
                                className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 flex justify-between items-center">
                                <p className="text-sm font-medium">New match invite from <span
                                    className="font-bold">ProWorm99</span></p>
                                <div className="flex gap-2">
                                    <button className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs">Accept
                                    </button>
                                    <button
                                        className="bg-zinc-200 dark:bg-zinc-700 px-3 py-1 rounded-md text-xs">Decline
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
            </ProtectedRoute>
    );
}