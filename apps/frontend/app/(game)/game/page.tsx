"use client";

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import SubPages from '@/src/components/game/lobby/SubPages';
import SocketStatus from '@/src/components/game/lobby/SocketStatus';
import { SC_Type, SC_GenericPacket } from '@/shared/packets/ServerClientPackets'
import { CS_Base, CS_Type } from '@/shared/packets/ClientServerPackets'

const socket: Socket = io("ws://localhost:8080", {transports: ['websocket']});
const DEBUG: boolean = (process.env.NODE_ENV == "development");

export default function LobbyPage() {
  /** State of the Page */
  const [state, setState] = useState("CONNECTING");

  /** bool wether websocket is connected */
  const [isConnected, setIsConnected] = useState(false);

  /** number representing to which lobby we are connected */
  /** Since we only have 1 lobby so far, and no way to specify, which to join, this is useless so far */
  const [lobbyId, setLobbyId] = useState(0);

  /**
   * This will only be executed once on startup, regardless of re-rendering
   * This is important, because otherwise we keep adding new listeners
  */
  useEffect(() => {

    const msgToClient = (data: string) => {
      if (DEBUG) console.log("NEXT: Client received packet: ", data);
      const dataObj: SC_GenericPacket = JSON.parse(data);

      // If trying to connect with an invalid ID, dont handle packet
      if (lobbyId != dataObj.lobbyId)
        return ;

      // Need this because our discriminated union may not always have type field
      if (!(dataObj && 'type' in dataObj)) {
        console.log("ERROR, frontend received packet with missing type")
        return ;
      }

      if (dataObj.type == SC_Type.SC_StartLobby)
        setState("LOBBY");
      else if (dataObj.type == SC_Type.SC_StartLoading)
        setState("LOADING");
      else if (dataObj.type == SC_Type.SC_StartGame)
        setState("GAME");
      else if (dataObj.type == SC_Type.SC_GameFinished)
        setState("ENDSCREEN");
      else if (dataObj.type == SC_Type.SC_DEV_StartConnecting)
        setState("CONNECTING");
      else {
        if (DEBUG) console.log("NEXT: Received unhandled package type: ");
      }

    }

    // Create fixed setter functions for binding to evens
    const onConnect = () => {setIsConnected(true)};
    const onDisconnect = () => {setIsConnected(false)};

    // Check for socket already being connected
    if (socket.connected) {
      onConnect();
    }

    // Bind functions to events
    socket.on('msgToClient', msgToClient);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Cleanup bound events
    return () => {
      socket.off('msgToClient', msgToClient)
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [])

  // Function for simpler packet handling
  const msgToServer = useCallback(<T extends CS_Base & { type: CS_Type }>(
    type: T['type'],
    data: Omit<T, | 'type' | 'lobbyId'>,
  ) => {
    const packet: T = {
      type: type,
      lobbyId: lobbyId,
      ...data,
    } as T;
    const packet_string = JSON.stringify(packet);
    if (socket && socket.connected) {
      socket.emit('msgToServer', packet_string);
      if (DEBUG) console.log("NEXT: Client sends packt to Server: ", packet_string);
    }
  }, [socket, lobbyId]);

  // JSX element for displaying page
  return (
    <div className="min-h-screen bg-slate-800 flex flex-col items-center justify-center"> 
      <SocketStatus isConnected={isConnected}/>
      <SubPages state={state} 
                msgToServer={msgToServer} 
                socket={socket}
                isConnected={isConnected}
                lobbyId={0}
                DEBUG={DEBUG}
                />
    </div>
  )
}
