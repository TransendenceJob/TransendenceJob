import { Lobby } from 'src/lobbies/Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';
import { log } from 'src/lobbies/lobbyUtil/log';

/**
 * @brief This should be ran anytime we handled a package
 *        and might need to perform general operations on the Lobby
 * @param lobby Lobby to tick
 */
export function tickLobby(lobby: Lobby) {
  if (lobby.clientManager.clients.length < 1) return;
  let readyCount = 0;
  lobby.clientManager.clients.forEach((client) => {
    if (client.ready) {
      readyCount++;
    }
  });
  // MIGHT NEED TO CHANGE LATER
  // Currently we start Loading once ALL Clients are ready, not when ALL 4 are ready
  if (readyCount == lobby.clientManager.clients.length) {
    log('All Clients are ready');
    lobby.setState(LobbyStateEnum.Loading);
  }
}
