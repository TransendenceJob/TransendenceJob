import { Socket } from 'socket.io-client';
import LobbyPage from '@/src/components/game/lobby/LobbyPage';
import LoadingPage from '@/src/components/game/lobby/LoadingPage';
import BabylonCanvas from "@/src/components/game/babylon/Babyloncanvas";
import EndPage from "@/src/components/game/lobby/EndPage";
import ErrorPage from '@/src/components/game/lobby/ErrorPage';
import ConnectingPage from '@/src/components/game/lobby/ConnectingPage';
import type { msgToServerType } from '@/lib/packets/msgToServerType';

interface Params {
  state: string,
  msgToServer: msgToServerType,
  socket: Socket,
  isConnected: boolean,
  DEBUG: boolean,
}

/**
 * Component that serves different Components,
 * based on the given state
 * @param state string that specifies State
 * @param msgToServer function for sending packet to server
 * @param socket Socket.io Socket object for Babylon Canvas
 * @param isConnected boolean, wether socket connection is established
 * @param DEBUG boolean wether Debug messages should be printed
 */
export default function SubPages({
  state,
  msgToServer,
  socket,
  isConnected,
  DEBUG,
}: Params) {
  if (state == 'CONNECTING') {
    return <ConnectingPage  msgToServer={msgToServer}
                            isConnected={isConnected}/>
  }
  else if (state === 'LOBBY') {
    return <LobbyPage msgToServer={msgToServer}/>
  }
  else if (state === 'LOADING') {
    return <LoadingPage msgToServer={msgToServer}/>
  }
  else if (state === 'GAME') {
    return <div style={{ width: "100%", height: "100%" }}>
    <BabylonCanvas msgToServer={msgToServer}
                          socket={socket}
                          DEBUG={DEBUG}/>
    </div>
  }
  else if (state === 'ENDSCREEN') {
    return <EndPage msgToServer={msgToServer}/>
  }
  else return <ErrorPage />;
}
