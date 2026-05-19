import { Lobby } from 'src/lobbies/Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';
import { log } from 'src/lobbies/lobbyUtil/log';
import { clientFailedLoading } from './clientFailedLoading';

/**
 * @brief This should be ran anytime we handled a package
 *        and might need to perform general operations on the Lobby
 * @param lobby Lobby to tick
 */
export function tickLoading(lobby: Lobby) {
  if (lobby.clientManager.clients.length < 1) {
    console.warn(
      'Error: Server reached Loading state with no registered player',
    );
    return;
  }
  let finishedLoadingCount = 0;
  lobby.clientManager.clients.forEach((client) => {
    // If Client has failed loading, send error data packet, go back to lobby, reset and sync client data
    if (client.loading.failed) {
      clientFailedLoading(lobby, client.id, client.loading.msg);
      return;
    }
    if (client.loading.done) {
      finishedLoadingCount++;
    }
  });
  if (finishedLoadingCount == lobby.clientManager.clients.length) {
    log('All Clients finished loading');
    lobby.setState(LobbyStateEnum.Game);
  }
  // Handle Timeout, if Client makes no progress
}
