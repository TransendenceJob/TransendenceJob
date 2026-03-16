"use client";

export default function HomePage() {
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 h-[calc(100vh-80px)] flex flex-col gap-6">

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase">Command Center</h1>
                    <p className="text-zinc-500 text-sm">Welcome back, Commander. Your squad is ready.</p>
                </div>
                <div className="hidden md:block text-right text-xs font-mono text-zinc-400">
                    SYSTEM_STATUS: <span className="text-green-500 animate-pulse">ONLINE</span>
                </div>
            </div>

            {/* Main Content , big game button*/}
            <div className="flex flex-col lg:flex-row gap-6 flex-grow overflow-hidden">

                <div
                    className="flex-[2] relative rounded-3xl bg-zinc-100 dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-800 flex flex-col items-center justify-center overflow-hidden group">
                    <div
                        className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>

                    <div className="z-10 text-center">
                        <div
                            className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/40">
                            <span className="text-white text-3xl">🚀</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Battle Arena</h2>
                        <p className="text-zinc-500 mb-6 text-sm">Physics engine initializing...</p>
                        <button
                            className="px-8 py-3 bg-foreground text-background rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform active:scale-95">
                            Launch Game
                        </button>
                    </div>
                </div>

                {/* Chat Window Component*/}
                <div
                    className="flex-1 min-w-[320px] flex flex-col bg-white dark:bg-zinc-900 rounded-3xl border border-foreground/10 shadow-sm overflow-hidden">

                    {/* Chat Header */}
                    <div
                        className="p-4 border-b border-foreground/5 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Global Chat
                        </h3>
                        <span className="text-[10px] font-mono opacity-50">42 USERS</span>
                    </div>

                    {/* Chat Messages Placeholder */}
                    <div className="flex-grow p-4 space-y-4 overflow-y-auto font-medium">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-blue-500 font-bold ml-2">System</span>
                            <div
                                className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3 rounded-2xl rounded-tl-none text-sm italic">
                                Welcome to the global channel! Be respectful to other worms.
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 items-end">
                            <span className="text-[10px] text-zinc-400 mr-2">You</span>
                            <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl rounded-tr-none text-sm">
                                Ready for a match? 🪱
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-zinc-400 ml-2">Norminette_Hater</span>
                            <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none text-sm">
                                I'm debugging my physics engine. Give me 5 mins!
                            </div>
                        </div>
                    </div>

                    {/* Chat Input Handling */}
                    <div className="p-4 border-t border-foreground/5">
                        <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="flex-grow p-2 px-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                className="p-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                     className="w-5 h-5">
                                    <path
                                        d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925L10.79 10l-7.097 1.836-1.414 4.925a.75.75 0 0 0 .826.95 44.898 44.898 0 0 0 15.891-8.113.75.75 0 0 0 0-1.2l-15.89-8.113Z"/>
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}