"use client";

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CS_DEV_StartLoading, CS_Type } from '@/shared/packets/ClientServerPackets';
import type { msgToServerType } from '@/lib/packets/msgToServerType';
import { PlayerSlot } from "@/app/(game)/game/page";

interface Params {
  msgToServer: msgToServerType;
  players: PlayerSlot [];
}

export default function LobbyPage({ msgToServer, players }: Params) {

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

  const togglePlayerReady = (player: PlayerSlot) => {
    if (!player.userId) return;
    msgToServer(CS_Type.CS_ReadyChange, {
      ready: !player.isReady
    });

    addFeedEvent(`${player.username} >> REQUESTING_SYNC`);
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
                <span
                    className="text-[9px] font-mono text-blue-600 font-black uppercase tracking-tighter">Live_Feed_Active</span>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <AnimatePresence mode="popLayout">
                  {feed.length === 0 && (
                      <motion.span
                          initial={{opacity: 0}}
                          animate={{opacity: 1}}
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
                          transition={{type: "spring", damping: 20, stiffness: 300}}
                          className="text-[11px] font-mono text-zinc-500 flex items-center gap-3 whitespace-nowrap"
                      >
          <span className="text-zinc-300 font-bold">
            [{new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'})}]
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
            {players.map((player,index) => (
                <motion.div
                    key={player.userId || `empty-${index}`} // use fall back index number for empty slots
                    whileHover={{ y: -6 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="relative"
                >
                  <div className={`relative z-10 aspect-[3/4.5] rounded-[2rem] border-2 transition-all duration-700 flex flex-col p-7
                ${player.isReady ? 'border-zinc-900 bg-white shadow-2xl shadow-zinc-200' : 'border-zinc-200 bg-white shadow-sm'}
              `}>
                    <div className="flex justify-between items-center mb-10">
                      <span className="font-mono text-[10px] text-zinc-400 font-black tracking-widest uppercase">Node_0{index + 1}</span>
                      <div className={`w-3 h-3 rounded-full transition-all duration-700 ${player.isReady ? 'bg-blue-600' : 'bg-zinc-200'}`} />
                    </div>

                    <div className={`flex-grow flex flex-col items-center justify-center gap-4 rounded-[1.5rem] transition-all duration-700 ${player.isReady ? 'bg-blue-50/50': 'bg-zinc-50'}`}>
                  <span className={`text-2xl font-black uppercase tracking-tight transition-colors duration-500 ${player.isReady ? player.color : 'text-zinc-300'}`}>
                    {player.username}
                  </span>

                      {player.isReady && (
                          <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="px-3 py-1 bg-zinc-900 rounded-full"
                          >
                            <span className="text-[8px] font-mono text-white font-bold uppercase tracking-widest">Active</span>
                          </motion.div>
                      )}
                    </div>

                    <button
                        onClick={() => {
                          console.log("Button clicked!");
                          // disabled={!player.userId}
                          togglePlayerReady(player);
                        }}
                        className={`mt-10 w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95
                          ${!player.userId ? 'opacity-50 cursor-not-allowed bg-zinc-100 text-zinc-300' :
                            player.isReady
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700'
                              : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'}
                          `}
                    >
                      {!player.userId ? 'Empty Slot' : player.isReady ? 'Confirmed' : 'Standby'}
                    </button>
                  </div>
                </motion.div>
            ))}
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
          <div>
              <button className="border-2 border-solid rounded-xl bg-slate-700  w-30 h-10" onClick={
                  () => {
                      msgToServer<CS_DEV_StartLoading>(CS_Type.CS_DEV_StartLoading, {});
                  }
              }>Load Assets</button>
          </div>
      </div>
  );
}