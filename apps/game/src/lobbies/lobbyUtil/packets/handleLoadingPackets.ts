import {
  CS_GenericPacket,
  CS_Type,
} from '@/shared/packets/ClientServerPackets';
import { Lobby } from 'src/lobbies/Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';
import { Client } from '@/shared/packets/Client';
import { log } from 'src/lobbies/lobbyUtil/log';

export function handleLoadingPackets(lobby: Lobby, data: CS_GenericPacket) {
  // Get Index for player this package might reference
  const client: Client | undefined = lobby.clients.find(
    (client) => client.id == data.userId,
  );

  switch (data.type) {
    // For when Client progresses Loading
    case CS_Type.CS_LoadingProgress: {
      if (!client) {
        break;
      }
      // DEV MODE ONLY
      if (data.percentage == 80) {
        log(`Error: Custom Intentional Loading Error`);
        client.loading.failed = true;
        client.loading.msg = `Error: Loading custom error`;
        break;
      }
      if (client.loading.progress > data.percentage) {
        log(
          `Error: ${data.userId} reports invalid loading progress ${client.loading.progress}=>${data.percentage}`,
        );
        client.loading.failed = true;
        client.loading.msg = `Error: Loading progress went from ${client.loading.progress} down to ${data.percentage}`;
        break;
      }
      client.loading.progress = data.percentage;
      client.loading.msg = data.msg;
      break;
    }

    // For when Client finishes Loading
    case CS_Type.CS_FinishedLoading: {
      if (!client) break;
      log(`Client ${client.id}:${client.name} is done with loading`);
      client.loading.msg = 'Finished Loading';
      client.loading.done = true;
      break;
    }

    // For when Client fails Loading
    case CS_Type.CS_FailedLoading: {
      if (client) {
        client.loading.msg = data.msg;
        client.loading.failed = true;
        log(`Client ${client.id}:${client.name} failed loading`);
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
