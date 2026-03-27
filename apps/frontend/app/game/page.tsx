"use client";

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import SubPages from '@/src/components/game/lobby/SubPages';
import SocketStatus from '@/src/components/game/lobby/SocketStatus';

interface JsonPacket {
  type: string;
}

const socket: Socket = io("ws://localhost:8080", {transports: ['websocket']});

export default function LobbyPage() {
  const [state, setState] = useState("CONNECTING");
  const [isConnected, setIsConnected] = useState(false);
  const [lastReceivedMsg, setlastReceivedMsg] = useState(null);


  /**
   * This will only be executed once on startup, regardless of re-rendering
   * This is important, because otherwise we keep adding new listeners
  */
  useEffect(() => {

    const msgToClient = (data: string) => {
      const dataObj: JsonPacket = JSON.parse(data);
      console.log("received obj on client: ", data);
      setlastReceivedMsg(data);
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
      else
        console.log("Received unhandled package type: ", dataObj);
    }

    socket.on('msgToClient', msgToClient);
    socket.on('connect', () => {setIsConnected(true)});
    socket.on('disconnect', () => {setIsConnected(false)});

    // Cleanup
    return () => {
      socket.off('msgToClient', msgToClient)
      socket.off('connect', () => {setIsConnected(true)});
      socket.off('disconnect', () => {setIsConnected(false)});
    };
  }, [])

  const msgToServer = useCallback((data: string) => {
    if (socket && socket.connected)
      socket.emit('msgToServer', data);
  }, []);

  const checkSocket = useCallback(() => {
    return (socket && socket.connected);
  }, []);

  return (
    <main className="min-h-screen bg-slate-800 flex flex-col items-center justify-center"> 
  
      <SocketStatus isConnected={isConnected}/>
      <SubPages state={state} 
                setState={setState}
                msgToServer={msgToServer} 
                lastReceivedMsg={lastReceivedMsg} 
                socket={socket}
                isConnected={isConnected}/>

    </main>
  )
}
