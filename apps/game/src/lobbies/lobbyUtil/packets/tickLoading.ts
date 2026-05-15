import { Lobby } from 'src/lobbies/Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';
import { log } from 'src/lobbies/lobbyUtil/log';
import {
  SC_FailedLoading,
  SC_LobbyData,
  SC_Type,
} from '@/shared/packets/ServerClientPackets';

/**
 * @brief This should be ran anytime we handled a package
 *        and might need to perform general operations on the Lobby
 * @param lobby Lobby to tick
 */
export function tickLoading(lobby: Lobby) {
  if (lobby.clients.length < 1) {
    console.warn(
      'Error: Server reached Loading state with no registered player',
    );
    return;
  }
  let finishedLoadingCount = 0;
  lobby.clients.forEach((client) => {
    // If Client has failed loading, send error data packet, go back to lobby, reset and sync client data
    if (client.loading.failed) {
      lobby.msgToClient<SC_FailedLoading>(SC_Type.SC_FailedLoading, {
        userId: client.id,
        msg: client.loading.msg,
      });
      // Resets Clients Loading/Readiness and tells them to go back to Lobby state
      lobby.setState(LobbyStateEnum.OpenLobby);
      // Syncs Clients to be updates properly
      lobby.msgToClient<SC_LobbyData>(SC_Type.SC_LobbyData, {
        lobbyData: lobby.clients,
      });
      return;
    }
    if (client.loading.done) {
      finishedLoadingCount++;
    }
  });
  if (finishedLoadingCount == lobby.clients.length) {
    log('All Clients finished loading');
    lobby.setState(LobbyStateEnum.Game);
  }
  // Handle Timeout, if Client makes no progress
}
