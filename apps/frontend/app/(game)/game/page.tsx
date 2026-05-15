"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import SubPages from '@/src/components/game/lobby/SubPages';
import SocketStatus from '@/src/components/game/lobby/SocketStatus';
import { SC_Type, SC_GenericPacket } from '@/shared/packets/ServerClientPackets';
import { Client, newClient, COLORS } from "@/shared/packets/Client";
import { CS_Base, CS_Type } from '@/shared/packets/ClientServerPackets';
import { useAuth } from "@/components/Providers";
import { lobbyDataPackets } from '@/shared/packets/util';
import { GameContext } from '@/src/components/game/lobby/GameContext';


const DEBUG: boolean = (process.env.NODE_ENV == "development");
// const DEBUG: boolean = true; // always true to testing prod as well

const updateSlotReadyState = (
  slots: Client[],
  userId: string,
  isReady: boolean
): Client[] =>
  slots.map(slot =>
      slot.id === userId
          ? { ...slot, ready: isReady }
          : slot
  );

const addPlayerToSlots = (
    slots: Client[],
    newClient: Client,
): Client[] => {
  const newSlots = [...slots];
  newSlots.push(newClient);
  return newSlots;
};

const removePlayerFromSlots = (
    slots: Client[],
    userId: string
): Client[] => {
  const newSlots: Client[] = [];
  slots.forEach(slot => {
    if (slot.id != userId)
      newSlots.push(slot);
  });
  return (newSlots);
}

const buildSlotsFromLobbyData = (
    players: Client[]
): Client[] => {
  // reset them before updating
  const newSlots: Client[] = [];
  // fill slots with data from server
  players.forEach(player => {
    if (DEBUG) console.log("Processing Player at Index:", player.slot, "Data:", player);
    newSlots.push(player);
  });
  return newSlots;
};

export default function LobbyPageController() {
  // Only ref needed, because its only assigned once
  const socketRef = useRef<Socket | null>(null);

  /** State of the Page */
  // Needs ref, because we read it in effect
  const [state, setState] = useState("CONNECTING");
  const stateRef = useRef(state);
  useEffect(() => {
    console.log(`Updating state from ${stateRef.current} to ${state}`);
    stateRef.current = state; }, [state]);

  /** Used during failed loading and connecting */
  const [errorMsg, setErrorMsg] = useState("");

  /** number representing to which lobby we are connected */
  // Needs ref, because we read it in effect
  const [lobbyId, setLobbyId] = useState(0);
  const lobbyIdRef = useRef(lobbyId);
  useEffect(() => {lobbyIdRef.current = lobbyId; }, [lobbyId])

  /** bool whether websocket is connected */
  // Doesnt need reference, because its only written inside effect, and read outside effect
  const [isConnected, setIsConnected] = useState(false);

  const { user } = useAuth();
  
  const [slots, setSlots] = useState<Client[]>(
    [0, 1, 2, 3].map(i => (newClient(i, COLORS[i])))
  );

  const updateState = (newState: string) => {
    stateRef.current = newState;
    setState(newState);
  }

  // Function for simpler packet handling
  const msgToServer = useCallback(<T extends CS_Base & { type: CS_Type }>(
    type: T['type'],
    data: Omit<T, | 'type' | 'lobbyId' | 'userId'>,
  ) => {
    const packet: T = {
      type: type,
      lobbyId: lobbyId,
      userId: user?.id ?? "",
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
            addPlayerToSlots(prev, p.clientData)
          );
          if (DEBUG) console.log("Player joined:", p.clientData.id);
          break;

        case SC_Type.SC_ClientDisconnect:
          if (DEBUG) console.log("Player left:", p.userId);
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
      let packetHandled = true;
      if (packet.type == SC_Type.SC_ConnectSuccess) {
        // Seperated, so this still counts as "handled"
        if (packet.userId == user?.id)
          updateState("LOBBY");
      }
      else if (packet.type == SC_Type.SC_ConnectFail) {
        // Seperated, so this still counts as "handled"
        if (packet.userId == user?.id)
          setErrorMsg(packet.msg);
      }
      else if (packet.type == SC_Type.SC_StartLobby)
        updateState("LOBBY");
      else if (packet.type == SC_Type.SC_StartLoading)
        updateState("LOADING");
      else if (packet.type == SC_Type.SC_StartGame)
        updateState("GAME");
      else if (packet.type == SC_Type.SC_GameFinished)
        updateState("ENDSCREEN");
      else if (packet.type == SC_Type.SC_DEV_StartConnecting)
        updateState("CONNECTING");
      else
        packetHandled = false;


      // We process if we are ALREADY in the lobby,
      // Or if we just received a packet that tells us we are NOW in the lobby
      const isLobbyDataPacket = lobbyDataPackets.includes(packet.type);
      if (stateRef.current === "LOBBY" && isLobbyDataPacket) {
        handleLobbyUpdates(packet);
      } else if (!packetHandled){
        if (DEBUG) console.warn(`[Frontend Page] Ignored: ${packet.type} in state ${stateRef.current}`);
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
      // Try to use the Display Name,
      // if no name, fall back to "Unnamed Player", 
      // if no id, fall back to "" (will cause connection to be rejected)
      userName: 
        user?.username ?
          user.username :
            user?.id ?
            `Unnamed Player ${user?.id.substring(0, 6)}` :
            "",
      errorMsg,
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