import {
  SC_FailedLoading,
  SC_LobbyData,
  SC_Type,
} from '@/shared/packets/ServerClientPackets';
import { Lobby } from 'src/lobbies/Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';

export function clientFailedLoading(lobby: Lobby, id: string, msg: string) {
  lobby.msgToClient<SC_FailedLoading>(SC_Type.SC_FailedLoading, {
    userId: id,
    msg: msg,
  });
  // Resets Clients Loading/Readiness and tells them to go back to Lobby state
  lobby.setState(LobbyStateEnum.OpenLobby);
  // Syncs Clients to be updates properly
  lobby.msgToClient<SC_LobbyData>(SC_Type.SC_LobbyData, {
    lobbyData: lobby.clientManager.clients,
  });
}
