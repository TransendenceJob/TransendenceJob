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
  lobbyId: number,
  game: BabylonCanvas | undefined,
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
  lobbyId,
  DEBUG,
}: Params) {
  return (
    <>
    {/* Game always exists, but not always displayed */}
    <div style = {{ display: state === 'GAME' ? 'block' : 'none', width: "100%", height: "100%"}}>
      <BabylonCanvas msgToServer={msgToServer}
                      socket={socket}
                      lobbyId={lobbyId}
                      DEBUG={DEBUG}/>
    </div>
    {state === 'CONNECTING' && <ConnectingPage msgToServer={msgToServer} isConnected={isConnected}/>}
    {state === 'LOBBY' && <LobbyPage msgToServer={msgToServer}/>}
    {state === 'LOADING' && <LoadingPage msgToServer={msgToServer}/>}
    {state === 'ENDSCREEN' && <EndPage msgToServer={msgToServer}/>}
    {state === 'ERROR' && <ErrorPage/>}
    </>
  )
}
