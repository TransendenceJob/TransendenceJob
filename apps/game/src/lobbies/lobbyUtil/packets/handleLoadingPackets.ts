import {
  CS_GenericPacket,
  CS_Type,
} from '@/shared/packets/ClientServerPackets';
import { Lobby } from 'src/lobbies/Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';
import { Client } from '../Client';

export function handleLoadingPackets(lobby: Lobby, data: CS_GenericPacket) {
  // Get Index for player this package might reference
  const client: Client | undefined = lobby.clients.find(
    (client) => client.id == data.userId,
  );

  switch (data.type) {
    // For when Client progresses Loading
    case CS_Type.CS_LoadingProgress: {
      if (client) {
        client.loading.progress = data.percentage;
        client.loading.msg = data.msg;
      }
      break;
    }

    // For when Client finishes Loading
    case CS_Type.CS_FinishedLoading: {
      if (client) {
        client.loading.msg = 'Finished Loading';
        client.loading.done = true;
      }
      break;
    }

    // For when Client fails Loading
    case CS_Type.CS_FailedLoading: {
      if (client) {
        client.loading.msg = data.msg;
        client.loading.failed = true;
      }
      break;
    }

    // For getting game state
    // DUPLICATE
    case CS_Type.CS_GetGameState: {
      lobby.sendGameStatePacket();
      break;
    }

    // DEV mode, should be removed late, Client commands state to be set to Game
    case CS_Type.CS_DEV_StartGame: {
      lobby.setState(LobbyStateEnum.Game);
      break;
    }

    default: {
      console.log(
        `Error: Server received packet with unhandled type: ${JSON.stringify(data)}`,
      );
    }
  }
}

/**
 * @brief Called when a new Client wants to connect to the Lobby
 * The client gives their id, which they should get from being signed in,
 * and awaits a response from the Server, wether they are accepted or not
 * @param lobby relevant Lobby
 * @param data packet with data
 */
// function connectionAttempt(lobby: Lobby, data: CS_ConnectAttempt) {}
