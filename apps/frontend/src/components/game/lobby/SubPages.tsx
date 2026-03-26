"use client";

import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import LobbyPage from '@/src/components/game/lobby/LobbyPage';
import LoadingPage from '@/src/components/game/lobby/LoadingPage';
import BabylonCanvas from "@/src/components/game/babylon/Babyloncanvas";
import EndPage from "@/src/components/game/lobby/EndPage";
import ErrorPage from '@/src/components/game/lobby/ErrorPage';


interface LobbyProps {
  onNavigate: (newState: string) => void; 
  msgToServer: (data: string) => void;
  lastReceivedMsg: string;
}


interface JsonPacket {
  type: string;
}


// !!!Look up right type!!!
const socket = io("ws://localhost:8080", {transports: ['websocket']});


export default function SubPages() {
  const [state, setState] = useState('LOBBY');
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
      if (dataObj.type == "sc.start.loading")
        setState("LOADING");
      else if (dataObj.type == "sc.start.game")
        setState("GAME");
      else if (dataObj.type == "sc.game.finished")
        setState("ENDSCREEN");
      else if (dataObj.type == "sc.DEV.start.lobby")
        setState("LOBBY");
      else
        console.log("Received unhandled package type: ", dataObj);
    }

    socket.on('msgToClient', msgToClient);

    // Cleanup
    return () => {
      socket.off('msgToClient', msgToClient)
    };
  }, [])

  const msgToServer = (data: string) => {
    if (socket && socket.connected)
      socket.emit('msgToServer', data);
    else
      console.error("Error: Client tried sending data, but websocket is not connected");
  };

  if (state === 'LOBBY') {
    return <LobbyPage onNavigate={setState} msgToServer={msgToServer} lastReceivedMsg={lastReceivedMsg}/>
  }
  else if (state === 'LOADING') {
    return <LoadingPage onNavigate={setState} msgToServer={msgToServer} lastReceivedMsg={lastReceivedMsg}/>
  }
  else if (state === 'GAME') {
    return <BabylonCanvas onNavigate={setState} msgToServer={msgToServer} lastReceivedMsg={lastReceivedMsg} socket={socket}/>
  }
  else if (state === 'ENDSCREEN') {
    return <EndPage onNavigate={setState} msgToServer={msgToServer} lastReceivedMsg={lastReceivedMsg}/>
  }
  else return <ErrorPage />;
}
