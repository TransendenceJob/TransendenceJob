import {
  CS_GenericPacket,
  CS_Type,
} from '@/shared/packets/ClientServerPackets';
import { Lobby } from 'src/lobbies/Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';
import {
  SC_DEV_ButtonPress,
  SC_Type,
} from '@/shared/packets/ServerClientPackets';

export function handleGamePackets(lobby: Lobby, data: CS_GenericPacket) {
  switch (data.type) {
    // For the button to send to Server, just send back a copy
    case CS_Type.CS_DEV_ButtonPress: {
      lobby.msgToClient<SC_DEV_ButtonPress>(SC_Type.SC_DEV_ButtonPress, {
        timestamp: data.timestamp,
        msg: data.message,
      });
      break;
    }

    // For getting game state
    case CS_Type.CS_GetGameState: {
      lobby.sendGameStatePacket();
      break;
    }

    // For switching game state
    case CS_Type.CS_DEV_SetGameState: {
      if (!lobby.game) return;
      lobby.game.setState(data.state);
      break;
    }

    // DEV mode, should be removed late, Client commands state to be set to Lobby
    case CS_Type.CS_DEV_StartLobby: {
      lobby.setState(LobbyStateEnum.OpenLobby);
      break;
    }

    // DEV mode, should be removed late, Client commands state to be set to Lobby after game ends
    case CS_Type.CS_DEV_StartEndscreen: {
      lobby.setState(LobbyStateEnum.EndScreen);
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
