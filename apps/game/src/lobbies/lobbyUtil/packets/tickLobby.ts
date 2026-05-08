import { Lobby } from 'src/lobbies/Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';

/**
 * @brief This should be ran anytime we handled a package
 *        and might need to perform general operations on the Lobby
 * @param lobby Lobby to tick
 */
export function tickLobby(lobby: Lobby, log: (msg: string) => void) {
  if (lobby.clients.length < 1) return;
  let readyCount = 0;
  lobby.clients.forEach((client) => {
    if (client.ready) {
      log(`Client ${client.id}:${client.name} is now ready`);
      readyCount++;
    }
  });
  // MIGHT NEED TO CHANGE LATER
  // Currently we start Loading once ALL Clients are ready, not when ALL 4 are ready
  if (readyCount == lobby.clients.length) {
    log('All Clients are ready');
    lobby.setState(LobbyStateEnum.Loading);
  }
}
