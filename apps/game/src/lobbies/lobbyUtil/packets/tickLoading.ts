import { Lobby } from 'src/lobbies/Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';
import { log } from 'src/lobbies/lobbyUtil/log';
import { SC_FailedLoading, SC_Type } from '@/shared/packets/ServerClientPackets';

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
    // If Client has failed loading, send package to stop Loading
    if (client.loading.failed) {
      lobby.msgToClient<SC_FailedLoading>(SC_Type.SC_FailedLoading, {
        userId: client.id,
        msg: client.loading.msg,
      });
      // experimental change, no clue if this will just work
      lobby.setState(LobbyStateEnum.OpenLobby );
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
