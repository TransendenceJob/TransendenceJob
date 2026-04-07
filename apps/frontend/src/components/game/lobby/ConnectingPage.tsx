// @ts-ignore
import { useEffect } from 'react';
// @ts-ignore
import { CS_ConnectAttempt, CS_Type } from '@/shared/packets/ClientServerPackets';

import type { msgToServerType } from '@/lib/packets/msgToServerType';

/**
 * Component for page, that the user gets served in the beginning
 * Sends a packet to the Server, notifying it in which state it is,
 * so the Page may move on to that state
 * @param msgToServer function for sending packet to server
 * @param isConnected boolean wether the socket is connected
 * @note Putting the Code for sending in a useEffect with our params as arguments,
 * makes it so the function is only called initially and whenever one of the params changes
 */
export default function ConnectingPage(
  msgToServer:msgToServerType,
  isConnected: boolean,
) {
  useEffect(() => {
    if (isConnected) {
      msgToServer<CS_ConnectAttempt>(CS_Type.CS_ConnectAttempt, {});
    }
  }, [isConnected, msgToServer]);
  return (
    <div>
      <h1 className="text-purple-500">Connecting to Game Server...</h1>
    </div>
  );
}
