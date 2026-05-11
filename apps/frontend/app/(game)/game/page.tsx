"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import SubPages from '@/src/components/game/lobby/SubPages';
import SocketStatus from '@/src/components/game/lobby/SocketStatus';
import { SC_Type, SC_GenericPacket, PlayerInLobby } from '@/shared/packets/ServerClientPackets';
import { CS_Base, CS_Type } from '@/shared/packets/ClientServerPackets';
import { useAuth } from "@/components/Providers";
import { lobbyDataPackets } from '@/shared/packets/util';

export interface PlayerSlot {
  userId: string | null;
  username: string;
  isReady: boolean;
  color: string;
}

const DEBUG: boolean = (process.env.NODE_ENV == "development");
// const DEBUG: boolean = true; // always true to testing prod as well
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
  const socketRef = useRef<Socket | null>(null);

  /** State of the Page */
  const [state, setState] = useState("CONNECTING");
  const stateRef = useRef(state);
  useEffect(() => {stateRef.current = state; }, [state]);

  /** number representing to which lobby we are connected */
  const [lobbyId, setLobbyId] = useState(0);
  const lobbyIdRef = useRef(lobbyId);
  useEffect(() => {lobbyIdRef.current = lobbyId; }, [lobbyId])

  /** bool whether websocket is connected */
  const [isConnected, setIsConnected] = useState(false);

  const { user } = useAuth();

  const client = {
    id: user ? user.id : "",
    name: user ? user.username : "",
    isReady: false,
  }

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
    data: Omit<T, | 'type' | 'lobbyId' | 'userId'>,
  ) => {
    const packet: T = {
      type: type,
      lobbyId: lobbyIdRef.current,
      userId: user ? user.id : "",
      ...data,
    } as T;
    const packet_string = JSON.stringify(packet);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('msgToServer', packet_string);
      if (DEBUG) console.log("NEXT: Client sends packt to Server: ", packet_string);
    }
  }, [lobbyIdRef, user]);


  useEffect(() => {
    const socket: Socket = io("ws://localhost:8080", { transports: ['websocket'] });
    socketRef.current = socket;
    
    // Create fixed setter functions for binding to evens
    const onConnect = () => {
      setIsConnected(true)
    };
    const onDisconnect = () => {
      setIsConnected(false)
    };

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
      //if (DEBUG) console.log("NEXT: Client received packet: ", data);
      const packet: SC_GenericPacket = JSON.parse(data);

      if (!packet || !('type' in packet)) {
        if (DEBUG) console.error("Frontend received malformed packet:", packet);
        return;
      }

      // If trying to connect with an invalid ID, dont handle packet
      if (lobbyIdRef.current != packet.lobbyId)
        return ;

      if (DEBUG) console.log("NEXT: Client received packet: ", packet);

      // Handle state Transitions
      if (packet.type == SC_Type.SC_StartLobby)
        setState("LOBBY");
      else if (packet.type == SC_Type.SC_StartLoading)
        setState("LOADING");
      else if (packet.type == SC_Type.SC_StartGame)
        setState("GAME");
      else if (packet.type == SC_Type.SC_GameFinished)
        setState("ENDSCREEN");
      else if (packet.type == SC_Type.SC_DEV_StartConnecting)
        setState("CONNECTING");

      // We process if we are ALREADY in the lobby,
      // Or if we just received a packet that tells us we are NOW in the lobby
      const isLobbyDataPacket = lobbyDataPackets.includes(packet.type);
      if (stateRef.current === "LOBBY" && isLobbyDataPacket) {
        handleLobbyUpdates(packet);
      } else {
        if (DEBUG) console.warn(`[Guard Blocked] Ignored ${packet.type} in state ${stateRef.current}`);
      }
    }

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
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // JSX element for displaying page
  return (
    <div className="min-h-screen bg-slate-800 flex flex-col items-center justify-center"> 
      <SocketStatus isConnected={isConnected}/>
      <SubPages state={stateRef} 
                msgToServer={msgToServer} 
                socket={socketRef}
                isConnected={isConnected}
                lobbyId={lobbyId}
                user={client}
                DEBUG={DEBUG}
                slot={slots}
                currentUserId={user?.id || ""}
                />
    </div>
  )
}