import { Lobby } from 'src/lobbies/Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';
import { log } from 'src/lobbies/lobbyUtil/log';

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
    if (client.loading.failed) {
      log(`Client ${client.id}:${client.name} failed loading`);
      // TODO Handle Loading Failure
      return;
    }
    if (client.loading.done) {
      log(`Client ${client.id}:${client.name} is done with loading`);
      finishedLoadingCount++;
    }
  });
  if (finishedLoadingCount == lobby.clients.length) {
    log('All Clients finished loading');
    lobby.setState(LobbyStateEnum.Game);
  }
}
