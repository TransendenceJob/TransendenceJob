//@ts-ignore
import { CS_DEV_StartLobby, CS_Type } from '@/shared/packets/ClientServerPackets';

import type { msgToServerType } from '@/lib/packets/msgToServerType';

interface Params {
  msgToServer: msgToServerType,
}

/**
 * Component for page, where the Clients may connect to a Lobby,
 * switch their readines and potentiallyh alter some settings
 * @param msgToServer function for sending packet to server
 */
export default function EndPage({
  msgToServer
}: Params) {
  return (
    <div>
      <h1 className="text-red-500">End Screen</h1>
      <button className="border-2 border-solid rounded-xl bg-slate-700  w-30 h-10" onClick={
        () => {
          msgToServer<CS_DEV_StartLobby>(CS_Type.CS_DEV_StartLobby, {});
        }
      }>Start Game</button>
    </div>
    );
}
