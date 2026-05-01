"use client";

import { useState, useEffect, useCallback  } from 'react';
import { io, Socket } from 'socket.io-client';
import SubPages from '@/src/components/game/lobby/SubPages';
import SocketStatus from '@/src/components/game/lobby/SocketStatus';
import { SC_Type, SC_GenericPacket } from '@/shared/packets/ServerClientPackets';
import { CS_Base, CS_Type } from '@/shared/packets/ClientServerPackets';
import { useAuth } from "@/components/Providers";

export interface PlayerSlot {
  userId: string | null;
  username: string;
  isReady: boolean;
  color: string;
}

const socket: Socket = io("ws://localhost:8080", { transports: ['websocket'] });
const DEBUG: boolean = (process.env.NODE_ENV == "development");
const COLORS = ['text-red-600', 'text-blue-600', 'text-emerald-600', 'text-amber-600'];

export default function LobbyPageController() {
  /** State of the Page */
  const [state, setState] = useState("CONNECTING");

  /** bool whether websocket is connected */
  const [isConnected, setIsConnected] = useState(false);

  /** number representing to which lobby we are connected */
  /** Since we only have 1 lobby so far, and no way to specify, which to join, this is useless so far */
  const [lobbyId, setLobbyId] = useState(0);

  const { user, isAuthenticated } = useAuth();
  const myUserId = user?.id || "guest";

  // initialize 4 empty player slots for static purpose in the first render
  const [slots, setSlots] = useState<PlayerSlot[]>(
      [0, 1, 2, 3].map(i => ({ userId: null, username: "Empty Slot", isReady: false, color: COLORS[i] }))
  );

  // Function for simpler packet handling
  const msgToServer = useCallback(<T extends CS_Base & { type: CS_Type }>(
      type: T['type'],
      data: Omit<T, 'type' | 'lobbyId'>,
  ) => {
    const packet = {
      type,
      lobbyId,
      ...data };
    const packet_string = JSON.stringify(packet);
    if (socket?.connected) {
      socket.emit('msgToServer', packet_string);
      if (DEBUG) console.log("Server Sent:", packet_string);
    }
    else {
      console.warn("Socket not connected. Cannot send.");
    }
  }, [lobbyId]);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const msgToClient = (data: string) => {
      const packet: SC_GenericPacket = JSON.parse(data);

      if (!packet || !('type' in packet)) {
        console.error("Frontend received malformed packet:", packet);
        return;
      }

      console.log("RAW PACKET ARRIVED:", packet);
      if (DEBUG) console.log("NEXT: Client received packet: ", packet);

      if (lobbyId !== packet.lobbyId) return;

      const handleLobbyUpdates = (p: any) => {
        switch (p.type) {
          case SC_Type.SC_ReadyChange:
            setSlots(prev => prev.map(s =>
                s.userId === p.userId ? { ...s, isReady: p.ready } : s
            ));
            break;

          case SC_Type.SC_LobbyData:
            // If the server provides a lobbyId, sync it here
            if (p.lobbyId !== undefined) setLobbyId(p.lobbyId);

            setSlots(prev => {
              // made sure we always use the newest server data to handle disconnect properly
              const newSlots: PlayerSlot[] = [0, 1, 2, 3].map(i => ({
                userId: null,
                username: "Empty Slot",
                isReady: false,
                color: COLORS[i]
              }));

              // fill slots with data from server
              if (Array.isArray(p.players)) {
                p.players.forEach((playerData: any, i: number) => {
                  if (newSlots[i]) {
                    newSlots[i] = {
                      ...newSlots[i],
                      userId: playerData.userId,
                      username: playerData.username || playerData.userId || "Unknown",
                      isReady: !!playerData.isReady,
                    };
                  }
                });
              }
              return newSlots;
            });
            break;
        }
      };
      // Handle State Transitions
      switch (packet.type) {
        case SC_Type.SC_StartLobby:       setState("LOBBY"); break;
        case SC_Type.SC_StartLoading:     setState("LOADING"); break;
        case SC_Type.SC_StartGame:        setState("GAME"); break;
        case SC_Type.SC_GameFinished:     setState("ENDSCREEN"); break;
        case SC_Type.SC_DEV_StartConnecting: setState("CONNECTING"); break;
      }

      // Handle Lobby UI updates
      handleLobbyUpdates(packet);
    };
    // Bind functions to events
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('msgToClient', msgToClient);

    // The 'connect' event may have fired before listeners were bound, retrigger onConnect;
    if (socket.connected) setIsConnected(true);

    // Cleanup bound events
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('msgToClient', msgToClient);
    };
  }, [lobbyId]);


  useEffect(() => {
    if (isConnected && isAuthenticated) {
      console.log("Sending JoinLobby request for user:", myUserId);
      msgToServer(CS_Type.CS_JoinLobby, { userId: myUserId });
    }
  }, [isConnected, isAuthenticated, msgToServer, myUserId]);

  // for now do it like this later we use protected route here
  if (!isAuthenticated) {
    return <div>Please log in to join the lobby.</div>;
  }

  return (
      <main className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center">
        <SocketStatus isConnected={isConnected} />
        <SubPages
            state={state}
            msgToServer={msgToServer}
            socket={socket}
            isConnected={isConnected}
            DEBUG={DEBUG}
            slots={slots}
            currentUserId={myUserId}
        />
      </main>
  );
}