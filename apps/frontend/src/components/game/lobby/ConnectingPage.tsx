import { useEffect } from 'react';
import { CS_JoinLobby, CS_Type } from '@/shared/packets/ClientServerPackets';

import { useGameContext } from './GameContext';

/**
 * Component for page, that the user gets served in the beginning
 * Sends a packet to the Server, notifying it in which state it is,
 * so the Page may move on to that state
 * @param msgToServer function for sending packet to server
 * @param isConnected boolean wether the socket is connected
 * @note Putting the Code for sending in a useEffect with our params as arguments,
 * makes it so the function is only called initially and whenever one of the params changes
 */
export default function ConnectingPage() {
  const {msgToServer, isConnected, userId, userName, DEBUG, errorMsg} = useGameContext();
  useEffect(() => {
    if (!isConnected || userId == "" || userName == "") {
      return ;
    }
    if (DEBUG) console.log("Sending JoinLobby request for user:", userId);
    msgToServer<CS_JoinLobby>(CS_Type.CS_JoinLobby, {
      userName: userName ?? ""
    });
  }, [isConnected, msgToServer, userId, userName, DEBUG]);
  if (errorMsg != "") {
    return (
      <div>
        <h1 className="text-red-500">{errorMsg}</h1>
      </div>
    );
  }
  if (!isConnected) {
    return (
      <div>
        <h1 className="text-purple-500">Waiting for Game Server to boot...</h1>
      </div>
    );
  }
  if (userId == "" || userName == "") {
    return (
      <div>
        <h1 className="text-red-500">Invalid User ID and Username, cannot connect</h1>
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-red-500">Connecting to Game Server...</h1>
    </div>);
}
