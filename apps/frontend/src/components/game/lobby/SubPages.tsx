import { Socket } from 'socket.io-client';
import LobbyPage from '@/src/components/game/lobby/LobbyPage';
import LoadingPage from '@/src/components/game/lobby/LoadingPage';
import BabylonCanvas from "@/src/components/game/babylon/Babyloncanvas";
import EndPage from "@/src/components/game/lobby/EndPage";
import ErrorPage from '@/src/components/game/lobby/ErrorPage';
import ConnectingPage from '@/src/components/game/lobby/ConnectingPage';
import type { msgToServerType } from '@/lib/packets/msgToServerType';
import {PlayerSlot} from "@/app/(game)/game/page";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { useGameContext } from './GameContext';

/**
 * Component that serves different Components,
 * based on the given state
 * @param state string that specifies State
 * @param msgToServer function for sending packet to server
 * @param socket Socket.io Socket object for Babylon Canvas
 * @param isConnected boolean, wether socket connection is established
 * @param DEBUG boolean wether Debug messages should be printed
 */
export default function SubPages() {
  const { isConnected, state } = useGameContext();
  return (
    <>
    {/* Game always exists, but not always displayed */}
    <div style = {{
      position: state === 'GAME' ? 'relative' : 'absolute',
      opacity: state === 'GAME' ? 1 : 0,
      visibility: state === 'GAME' ? 'visible' : 'hidden',
      width: "100%", height: "100%"
    }}>
      {isConnected && <BabylonCanvas/>}
    </div>
    {state === 'CONNECTING' && <ConnectingPage/>}
    {state === 'LOBBY' && <LobbyPage/>}
    {state === 'LOADING' && <LoadingPage/>}
    {state === 'ENDSCREEN' && <EndPage/>}
    {state === 'ERROR' && <ErrorPage/>}
    </>
  )
}
