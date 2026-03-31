"use client";

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import SubPages from '@/src/components/game/lobby/SubPages';
import SocketStatus from '@/src/components/game/lobby/SocketStatus';

interface JsonPacket {
  type: string;
}

const socket: Socket = io("ws://localhost:8080", {transports: ['websocket']});
const DEBUG: boolean = (process.env.NODE_ENV == "development");

export default function LobbyPage() {
  /** State of the Page */
  const [state, setState] = useState("CONNECTING");

  /** bool wether websocket is connected */
  const [isConnected, setIsConnected] = useState(false);

  /**
   * This will only be executed once on startup, regardless of re-rendering
   * This is important, because otherwise we keep adding new listeners
  */
  useEffect(() => {
    const msgToClient = (data: string) => {
      if (DEBUG) console.log("NEXT: Client received packet: ", data);
      const dataObj: JsonPacket = JSON.parse(data);
      if (dataObj.type == "sc.DEV.start.lobby")
        setState("LOBBY");
      else if (dataObj.type == "sc.start.loading")
        setState("LOADING");
      else if (dataObj.type == "sc.start.game")
        setState("GAME");
      else if (dataObj.type == "sc.game.finished")
        setState("ENDSCREEN");
      else if (dataObj.type == "sc.DEV.start.connecting")
        setState("CONNECTING");
      else {
        if (DEBUG) console.log("NEXT: Received unhandled package type: ");
      }
    }

    // Create fixed setter functions for binding to evens
    const onConnect = () => {setIsConnected(true)};
    const onDisconnect = () => {setIsConnected(false)};

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

  // Create Callback function so components can send to Server
  const msgToServer = useCallback((data: string) => {
    if (socket && socket.connected) {
      socket.emit('msgToServer', data);
      if (DEBUG) console.log("NEXT: Client sends packt to Server: ", data);
    }
  }, []);

  // JSX element for displaying page
  return (
    <main className="min-h-screen bg-slate-800 flex flex-col items-center justify-center"> 
      <SocketStatus isConnected={isConnected}/>
      <SubPages state={state} 
                msgToServer={msgToServer} 
                socket={socket}
                isConnected={isConnected}
                DEBUG={DEBUG}
                />
    </main>
  )
}
