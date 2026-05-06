"use client";

import { useState, useEffect, useCallback  } from 'react';
import { io, Socket } from 'socket.io-client';
import SubPages from '@/src/components/game/lobby/SubPages';
import SocketStatus from '@/src/components/game/lobby/SocketStatus';
import { SC_Type, SC_GenericPacket, PlayerInLobby } from '@/shared/packets/ServerClientPackets';
import { CS_Base, CS_Type } from '@/shared/packets/ClientServerPackets';
import { useAuth } from "@/components/Providers";

export interface PlayerSlot {
  userId: string | null;
  username: string;
  isReady: boolean;
  color: string;
}

const socket: Socket = io("ws://localhost:8080", { transports: ['websocket'] });
// const DEBUG: boolean = (process.env.NODE_ENV == "development");
const DEBUG: boolean = true; // always true to testing prod as well
const COLORS = ['text-red-600', 'text-blue-600', 'text-emerald-600', 'text-amber-600'];

const updateSlotReadyState = (
    slots: PlayerSlot[],
    userId: string,
    isReady: boolean
) =>
    slots.map(slot =>
        slot.userId === userId
            ? { ...slot, isReady }
            : slot
    );

const addPlayerToSlots = (
    slots: PlayerSlot[],
    userId: string,
    username?: string
): PlayerSlot[] => {
  const newSlots = [...slots];

  const emptyIndex = newSlots.findIndex(slot => slot.userId === null);

  if (emptyIndex !== -1) {
    newSlots[emptyIndex] = {
      ...newSlots[emptyIndex],
      userId,
      username: username || "New Recruit",
      isReady: false,
    };
  }

  return newSlots;
};

const removePlayerFromSlots = (
    slots: PlayerSlot[],
    userId: string
): PlayerSlot[] =>
    slots.map(slot =>
        slot.userId === userId
            ? { ...slot, userId: null, username: "Empty Slot", isReady: false }
            : slot
    );

const buildSlotsFromLobbyData = (
    players: PlayerInLobby[]
): PlayerSlot[] => {
  // reset them before updating
  const refreshedSlots: PlayerSlot[] = [0, 1, 2, 3].map(i => ({
    userId: null,
    username: "Empty Slot",
    isReady: false,
    color: COLORS[i],
  }));

  // fill slots with data from server
  players.forEach(player => {
    if (DEBUG) console.log("Processing Player at Index:", player.indexInLobby, "Data:", player);
    const i = player.indexInLobby;
    if (refreshedSlots[i]) {
      refreshedSlots[i] = {
        ...refreshedSlots[i],
        userId: player.userId,
        username: player.userName || `Player ${i + 1}`,
        isReady: player.ready,
      };
    }
  });

  return refreshedSlots;
};

export default function LobbyPageController() {
  /** State of the Page */
  const [state, setState] = useState("CONNECTING");

  /** bool whether websocket is connected */
  const [isConnected, setIsConnected] = useState(false);

  /** number representing to which lobby we are connected */
  /** Since we only have 1 lobby so far, and no way to specify, which to join, this is useless so far */
  const [lobbyId, setLobbyId] = useState(0);

  const { user} = useAuth();

  // initialize 4 empty player slots for static purpose in the first render
  const [slots, setSlots] = useState<PlayerSlot[]>(
      [0, 1, 2, 3].map(i => ({
        userId: null,
        username: "Empty Slot",
        isReady: false,
        color: COLORS[i]
      }))
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
      if (DEBUG) console.warn("Socket not connected. Cannot send.");
    }
  }, [lobbyId]);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const handleLobbyUpdates = (p: SC_GenericPacket) => {
      switch (p.type) {
        case SC_Type.SC_ReadyChange:
          setSlots(prev =>
              updateSlotReadyState(prev, p.userId, p.ready)
          );
          break;

        case SC_Type.SC_ClientJoin:
          setSlots(prev =>
              addPlayerToSlots(prev, p.userId, p.userName)
          );
          if (DEBUG) console.log("Player joined:", p.userId);
          break;

        case SC_Type.SC_ClientDisconnect:
          setSlots(prev =>
              removePlayerFromSlots(prev, p.userId)
          );
          break;

        case SC_Type.SC_LobbyData: {
          // If the server provides a lobbyId, sync it here
          if (p.lobbyId !== undefined) setLobbyId(p.lobbyId);

          setSlots(buildSlotsFromLobbyData(p.lobbyData));
          break;
        }
      }
    };

    const msgToClient = (data: string) => {
      const packet: SC_GenericPacket = JSON.parse(data);

      if (!packet || !('type' in packet)) {
        if (DEBUG) console.error("Frontend received malformed packet:", packet);
        return;
      }

      if (DEBUG) if (DEBUG) console.log("NEXT: Client received packet: ", packet);

      if (DEBUG) console.log(`[Packet Arrival] Type: ${packet.type} | Current UI State: ${state}`);
      if (lobbyId !== packet.lobbyId) return;


      // Handle State Transitions
      switch (packet.type) {
        case SC_Type.SC_StartLobby:       setState("LOBBY"); break;
        case SC_Type.SC_StartLoading:     setState("LOADING"); break;
        case SC_Type.SC_StartGame:        setState("GAME"); break;
        case SC_Type.SC_GameFinished:     setState("ENDSCREEN"); break;
        case SC_Type.SC_DEV_StartConnecting: setState("CONNECTING"); break;
      }

      // Determine if this packet carries Lobby Data
      const isLobbyDataPacket = [
        SC_Type.SC_LobbyData, // contains the full list of players
        SC_Type.SC_ReadyChange,
        SC_Type.SC_ClientJoin,
        SC_Type.SC_ClientDisconnect
      ].includes(packet.type);

      // We process if we are ALREADY in the lobby,
      // Or if we just received a packet that tells us we are NOW in the lobby
      if (state === "LOBBY" || packet.type === SC_Type.SC_StartLobby || isLobbyDataPacket) {
        handleLobbyUpdates(packet);
      } else {
        if (DEBUG) console.warn(`[Guard Blocked] Ignored ${packet.type} in state ${state}`);
      }
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
  }, [lobbyId, state]);


  useEffect(() => {
    if (isConnected && user){
      if (DEBUG) console.log("Sending JoinLobby request for user:", user);
      msgToServer(CS_Type.CS_JoinLobby, {
        userId: user.id,
        userName: user?.username
      });
    }
  }, [isConnected, msgToServer, user]);

  // for now do it like this later we use protected route here
  if (!user){
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
            currentUserId={user?.id || ""}
        />
      </main>
  );
}