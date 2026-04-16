// @ts-ignore
import { CS_DEV_StartGame, CS_Type } from '@/shared/packets/ClientServerPackets';

import type { msgToServerType } from '@/lib/packets/msgToServerType';

interface Params {
  msgToServer: msgToServerType,
}

/**
 * Component for page, where the Clients and Server load the game logic,
 * while the Client page shows a progress bar to notify the client about progress
 * @param msgToServer function for sending packet to server
 */
export default function LoadingPage({
  msgToServer
}: Params) {
  return (
    <div>
      <h1 className="text-blue-500">Loading...</h1>
      <button className="border-2 border-solid rounded-xl bg-slate-700  w-30 h-10" onClick={
        () => {
          msgToServer<CS_DEV_StartGame>(CS_Type.CS_DEV_StartGame, {});
        }
      }>Start Game</button>
    </div>
    );
}
