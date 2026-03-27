import { Socket } from 'socket.io-client';
import LobbyPage from '@/src/components/game/lobby/LobbyPage';
import LoadingPage from '@/src/components/game/lobby/LoadingPage';
import BabylonCanvas from "@/src/components/game/babylon/Babyloncanvas";
import EndPage from "@/src/components/game/lobby/EndPage";
import ErrorPage from '@/src/components/game/lobby/ErrorPage';
import ConnectingPage from '@/src/components/game/lobby/ConnectingPage';


interface Params {
  state: string;
  msgToServer: (data: string) => void;
  socket: Socket;
  isConnected: boolean;
  DEBUG: boolean;
}


export default function SubPages({state,
                                  msgToServer,
                                  socket,
                                  isConnected,
                                  DEBUG,
  }: Params) {

  if (state == 'CONNECTING') {
    return <ConnectingPage msgToServer={msgToServer} isConnected={isConnected}/>
  }
  else if (state === 'LOBBY') {
    return <LobbyPage msgToServer={msgToServer}/>
  }
  else if (state === 'LOADING') {
    return <LoadingPage msgToServer={msgToServer} />
  }
  else if (state === 'GAME') {
    return <BabylonCanvas msgToServer={msgToServer}
                          socket={socket}
                          DEBUG={DEBUG}/>
  }
  else if (state === 'ENDSCREEN') {
    return <EndPage msgToServer={msgToServer}/>
  }
  else return <ErrorPage />;
}
