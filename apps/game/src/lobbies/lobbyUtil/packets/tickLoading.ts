import { Lobby } from 'src/lobbies/Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';

/**
 * @brief This should be ran anytime we handled a package
 *        and might need to perform general operations on the Lobby
 * @param lobby Lobby to tick
 */
export function tickLoading(lobby: Lobby, log: (msg: string) => void) {
  console.log('1');
  if (lobby.clients.length < 1) {
    console.warn(
      'Error: Server reached Loading state with no registered player',
    );
    return;
  }
  console.log('2');
  let finishedLoadingCount = 0;
  lobby.clients.forEach((client) => {
    if (client.loading.failed) {
      log(`Client ${client.id}:${client.name} failed loading`);
      // TODO Handle Loading Failure
      return;
    }
    if (client.loading.done) {
      log(`Client ${client.id}:${client.name} is done with loading`);
      console.log('3');
      finishedLoadingCount++;
    }
  });
  if (finishedLoadingCount == lobby.clients.length) {
    console.log('4');
    log('All Clients finished loading');
    lobby.setState(LobbyStateEnum.Game);
  }
}
