"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CS_DEV_StartLoading, CS_Type } from '@/shared/packets/ClientServerPackets';
import type { msgToServerType } from '@/lib/packets/msgToServerType';
import { PlayerSlot } from "@/app/(game)/game/page";

interface Params {
  msgToServer: msgToServerType;
  players: PlayerSlot [];
  currentUserId: string;
}

export default function LobbyPage({ msgToServer, players, currentUserId }: Params) {

  const [feed, setFeed] = useState<{id: number, msg: string}[]>([]);
  const feedCounter = useRef(0);

  const readyCount = players.filter(p => p.isReady).length;
  const allReady = readyCount === 4;
  
  const addFeedEvent = (msg: string) => {
    setFeed(prev => {
      if (prev.length > 0 && prev[prev.length - 1].msg === msg) return prev;
      feedCounter.current += 1;
      return [
        ...prev,
        { id: feedCounter.current, msg }
      ].slice(-5);
    });
  };

    // 1. We use a ref here, kinda like a container to prevent completly rerender when changes arrives
    const prevPlayersRef = useRef<PlayerSlot[]>(players);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            prevPlayersRef.current = players;
            return;
        }
        players.forEach((player, index) => {
            const prevPlayer = prevPlayersRef.current[index];

            // Case A: A new player joined an empty slot
            if (player.userId && !prevPlayer?.userId) {
                addFeedEvent(`${player.username} CONNECTED_TO_NODE_0${index + 1}`);
            }
            // Case B: A player left
            else if (!player.userId && prevPlayer?.userId) {
                addFeedEvent(`${prevPlayer.username} DISCONNECTED`);
            }
            // Case C: Readiness changed
            else if (player.userId && prevPlayer && player.isReady !== prevPlayer.isReady) {
                const status = player.isReady ? 'READY_CONFIRMED' : 'STANDBY_MODE';
                addFeedEvent(`${player.username} >> ${status}`);
            }
        });

        prevPlayersRef.current = players;
    }, [players]);

  const togglePlayerReady = (player: PlayerSlot) => {
      console.log("Checking permission:");
      console.log("Player ID in slot:", player.userId);
      console.log("My currentUserId:", currentUserId);
      if (!player.userId || player.userId !== currentUserId) {
          console.warn("You can't toggle someone else's ready status!");
          return;
      }

      msgToServer(CS_Type.CS_ReadyChange, {
          userId: currentUserId,
          ready: !player.isReady
      });
  };

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-blue-100">
            <main className="flex-grow max-w-6xl mx-auto w-full px-6 py-12 flex flex-col justify-center">

                <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="space-y-2">
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-5xl font-black tracking-tighter uppercase text-zinc-900"
                        >
                            Tactical <span className="text-blue-600">Lobby</span>
                        </motion.h2>
                        <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.3em] font-bold">
                            Status: Awaiting Squad Confirmation
                        </p>
                    </div>

                    {/* LIVE ACTIVITY FEED */}
                    <div className="w-full md:w-96 min-h-[110px] overflow-hidden relative bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                        <div className="absolute top-2 right-4 flex gap-1.5 items-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
                            <span className="text-[9px] font-mono text-blue-600 font-black uppercase tracking-tighter">
              Live_Feed_Active
            </span>
                        </div>

                        <div className="flex flex-col gap-2 mt-4">
                            <AnimatePresence mode="popLayout">
                                {feed.length === 0 && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-[11px] font-mono text-zinc-300 italic"
                                    >
                                        Waiting for squad input...
                                    </motion.span>
                                )}
                                {feed.map((event) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                        className="text-[11px] font-mono text-zinc-500 flex items-center gap-3 whitespace-nowrap"
                                    >
                  <span className="text-zinc-300 font-bold">
                    [{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                  </span>
                                        <span className="text-zinc-800 font-bold tracking-tight">
                    {event.msg}
                  </span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* PLAYER CARDS */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {players.map((player, index) => {
                        // Check if this card belongs to the local user
                        const isMe = player.userId === currentUserId;
                        const isEmpty = !player.userId;

                        return (
                            <motion.div
                                key={player.userId || `empty-${index}`} // use fall back index number for empty slots
                                whileHover={!isEmpty ? { y: -6 } : {}}
                                transition={{ type: "spring", stiffness: 150 }}
                                className="relative"
                            >
                                <div className={`relative z-10 aspect-[3/4.5] rounded-[2rem] border-2 transition-all duration-700 flex flex-col p-7
                ${isEmpty ? 'border-dashed border-zinc-200 bg-transparent shadow-none' : 'border-solid shadow-sm'}
                ${isMe ? 'ring-4 ring-blue-600/20' : ''}
                ${player.isReady ? 'border-zinc-900 bg-white shadow-2xl shadow-zinc-200' : 'border-zinc-200 bg-white'}
              `}>

                                    <div className="flex justify-between items-center mb-10">
                  <span className={`font-mono text-[10px] font-black tracking-widest uppercase ${isEmpty ? 'text-zinc-300' : 'text-zinc-400'}`}>
                    Node_0{index + 1}
                  </span>
                                        {!isEmpty && (
                                            <>
                                                {isMe ? (
                                                    <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black tracking-tighter">YOU</span>
                                                ) : (
                                                    <div className={`w-3 h-3 rounded-full transition-all duration-700 ${player.isReady ? 'bg-blue-600' : 'bg-zinc-200'}`} />
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className={`flex-grow flex flex-col items-center justify-center gap-4 rounded-[1.5rem] transition-all duration-700 
                  ${isEmpty ? 'bg-zinc-50/30' : player.isReady ? 'bg-blue-50/50' : 'bg-zinc-50'}
                `}>
                  <span className={`text-2xl font-black uppercase tracking-tight transition-colors duration-500 
                    ${isEmpty ? 'text-zinc-200' : player.isReady ? player.color : 'text-zinc-400'}
                  `}>
                    {isEmpty ? '---' : player.username}
                  </span>

                                        {!isEmpty && player.isReady && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-3 py-1 bg-zinc-900 rounded-full">
                      <span className="text-[8px] font-mono text-white font-bold uppercase tracking-widest">
                        {isMe ? 'Me Active' : 'Active'}
                      </span>
                                            </motion.div>
                                        )}
                                    </div>

                                    <button
                                        disabled={isEmpty || !isMe}
                                        onClick={() => togglePlayerReady(player)}
                                        className={`mt-10 w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all
                    ${isMe ? 'active:scale-95 cursor-pointer' : 'cursor-default'}
                    ${isEmpty
                                            ? 'bg-transparent border border-zinc-100 text-zinc-200'
                                            : player.isReady
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700'
                                                : isMe
                                                    ? 'bg-zinc-900 text-white hover:bg-black'
                                                    : 'bg-zinc-100 text-zinc-400'}
                  `}
                                    >
                                        {isEmpty ? 'Awaiting...' : player.isReady ? 'Confirmed' : isMe ? 'Initialize' : 'Standby'}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* System Status */}
                <div className="mt-20 flex flex-col items-center">
                    <div className="w-full max-w-md bg-white border border-zinc-200 rounded-full p-1.5 mb-6 flex gap-1 shadow-inner">
                        {players.map((p, index) => (
                            <div
                                key={p.userId || `bar-${index}`}
                                className={`flex-grow h-3 rounded-full transition-all duration-1000 ease-out ${p.isReady ? 'bg-blue-600 shadow-sm' : 'bg-zinc-100'}`}
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {allReady ? (
                            <motion.div
                                key="launch"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                                    <h3 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase italic">
                                        Initializing Launch Sequence
                                    </h3>
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                                </div>
                                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-[0.5em] font-bold">
                All systems are running normal
              </span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="wait-status"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center gap-1"
                            >
              <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                Readiness: {readyCount} / {players.length} Squad Members
              </span>
                                <div className="w-1 h-4 bg-zinc-200 rounded-full animate-bounce mt-2" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <div className="p-6">
                <button
                    className="border-2 border-solid rounded-xl bg-slate-700  w-30 h-10" onClick={
                    () => {
                        msgToServer<CS_DEV_StartLoading>(CS_Type.CS_DEV_StartLoading, {});
                    }
                }>Load Assets
                </button>
            </div>
        </div>
    );
}