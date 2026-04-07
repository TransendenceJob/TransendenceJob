// @ts-ignore
import { CS_DEV_StartLoading, CS_Type } from '@/shared/packets/ClientServerPackets';

import type { msgToServerType } from '@/lib/packets/msgToServerType';

/**
 * Component for page, where the Clients may connect to a Lobby,
 * switch their readines and potentiallyh alter some settings
 * @param msgToServer function for sending packet to server
 */
export default function LobbyPage(
  msgToServer : msgToServerType
) {
  return (
    <div>
      <h1 className="text-green-500">Lobby</h1>
      <button className="border-2 border-solid rounded-xl bg-slate-700  w-30 h-10" onClick={
        () => {
          msgToServer<CS_DEV_StartLoading>(CS_Type.CS_DEV_StartLoading, {});
        }
        }>Load Assets</button>
    </div>
  );
}
