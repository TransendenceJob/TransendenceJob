"use client";

import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import SubPages from '@/src/components/game/lobby/SubPages';
import SocketStatus from '@/src/components/game/lobby/SocketStatus';
import { SC_Type, SC_GenericPacket } from '@/shared/packets/ServerClientPackets';
import { Client } from "@/shared/packets/Client";
import { CS_Base, CS_Type } from '@/shared/packets/ClientServerPackets';
import { useAuth } from "@/components/Providers";
import { lobbyDataPackets } from '@/shared/packets/util';
import { GameContext } from '@/src/components/game/lobby/GameContext';

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
): PlayerSlot[] =>
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
    players: Client[]
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
    if (DEBUG) console.log("Processing Player at Index:", player.slot, "Data:", player);
    const i = player.slot;
    if (refreshedSlots[i]) {
      refreshedSlots[i] = {
        ...refreshedSlots[i],
        userId: player.id,
        username: player.name || `Player ${i + 1}`,
        isReady: player.ready,
      };
    }
  });
  return refreshedSlots;
};

export default function LobbyPageController() {
  // Only ref needed, because its only assigned once
  const socketRef = useRef<Socket | null>(null);

  /** State of the Page */
  // Needs ref, because we read it in effect
  const [state, setState] = useState("CONNECTING");
  const stateRef = useRef(state);
  useEffect(() => {stateRef.current = state; }, [state]);

  /** number representing to which lobby we are connected */
  // Needs ref, because we read it in effect
  const [lobbyId, setLobbyId] = useState(0);
  const lobbyIdRef = useRef(lobbyId);
  useEffect(() => {lobbyIdRef.current = lobbyId; }, [lobbyId])

  /** bool whether websocket is connected */
  // Doesnt need reference, because its only written inside effect, and read outside effect
  const [isConnected, setIsConnected] = useState(false);

  const { user } = useAuth();
  
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
      lobbyId: lobbyId,
      userId: user ? user.id : "",
      ...data,
    } as T;
    const packet_string = JSON.stringify(packet);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('msgToServer', packet_string);
      if (DEBUG) console.log("NEXT: Client sends packt to Server: ", packet_string);
    }
  }, [lobbyId, user]);


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
    <GameContext.Provider value={{
      state, stateRef, setState,
      lobbyId, lobbyIdRef, setLobbyId,
      slots,
      isConnected,
      msgToServer,
      socketRef: socketRef,
      userId: user?.id ?? "",
      DEBUG
    }}>
      <div className="min-h-screen bg-slate-800 flex flex-col items-center justify-center"> 
        <SocketStatus isConnected={isConnected}/>
        <SubPages/>
      </div>
    </GameContext.Provider>
  )
}

/*
  Explanation of useStates, references and linking
  const [var, setVar] = useState("CONNECTING");
  Creates a variables, which is essentially read-only, 
  and can be used in callbacks and useEffects as dependency,
  so they are rerendered, once the underlying value of var changes.
  This actual changing of var is done via the setter function setVart(),
  which triggers the rerenders, which receive the updated value

  const varRef = useRef(var);
  Creates a Reference, that can be changed and accessed anywhere,
  its essentially a pointer, with its original value set to whatever var is.
  Note, that there is no link between varRef and var, 
  except for them initally having the same value.

  useEffect(() => {stateRef.current = state; }, [state]);
  Creates an event, which updates the value stored in our reference,
  whenever we call the setState() function.

  We are left with a reference, that can access the newest value of var,
  however, it cannot properly change what is stored in var.
  We also have var and setVar() which you can use to make a component rerender,
  dependent on the changing of var

  We use this functionality, by setting up a useEffect,
  that only ever runs once, in order to set up the listener once.
  This means that we cannot rerender this component,
  or we would duplicate listeners.
  Thats why inside there, we only READ the "varRef" and stateId,
  by getting the value from the reference.
  The actual setting is done with "setVar()", which triggers the above useEffect,
  updating the reference to be properly set as well.

  In simple terms:
  Inside the useEffect:
    Set Variables with the setter function (setVar()),
    Read Variables from the reference (varRef)
  Everywhere else:
    Set with setter function (setVar()),
    read from either var or reference
*/