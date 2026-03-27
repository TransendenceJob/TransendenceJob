import { Socket } from 'socket.io-client';
import LobbyPage from '@/src/components/game/lobby/LobbyPage';
import LoadingPage from '@/src/components/game/lobby/LoadingPage';
import BabylonCanvas from "@/src/components/game/babylon/Babyloncanvas";
import EndPage from "@/src/components/game/lobby/EndPage";
import ErrorPage from '@/src/components/game/lobby/ErrorPage';
import ConnectingPage from '@/src/components/game/lobby/ConnectingPage';


interface LobbyProps {
  state: string;
  setState: (data: string) => void;
  msgToServer: (data: string) => void;
  lastReceivedMsg: string;
  socket: Socket;
  isConnected: boolean;
}


export default function SubPages({state, 
                                  setState,
                                  msgToServer, 
                                  lastReceivedMsg, 
                                  socket,
                                  isConnected }: LobbyProps) {

  if (state == 'CONNECTING') {
    return <ConnectingPage msgToServer={msgToServer} isConnected={isConnected}/>
  }
  else if (state === 'LOBBY') {
    return <LobbyPage msgToServer={msgToServer} lastReceivedMsg={lastReceivedMsg}/>
  }
  else if (state === 'LOADING') {
    return <LoadingPage msgToServer={msgToServer} lastReceivedMsg={lastReceivedMsg}/>
  }
  else if (state === 'GAME') {
    return <BabylonCanvas moveToEndscreen={() => {setState('ENDSCREEN')}} msgToServer={msgToServer} lastReceivedMsg={lastReceivedMsg} socket={socket}/>
  }
  else if (state === 'ENDSCREEN') {
    return <EndPage msgToServer={msgToServer} lastReceivedMsg={lastReceivedMsg}/>
  }
  else return <ErrorPage />;
}
