import {
  CS_ConnectAttempt,
  CS_GenericPacket,
  CS_Type,
} from '@/shared/packets/ClientServerPackets';
import {
  SC_ConnectFail,
  SC_ConnectSuccess,
  SC_GenericStatePacket,
  SC_Type,
} from '@/shared/packets/ServerClientPackets';
import { Lobby } from 'src/lobbies/Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';
import { translateLobbyState } from '../translateLobbyState';
import { Client, resetClient } from '../Client';
import { log } from 'src/lobbies/lobbyUtil/log';

const LOBBY_MAX_SLOTS = 4;

export function handleLobbyPackets(lobby: Lobby, data: CS_GenericPacket) {
  switch (data.type) {
    // New Client wants to connect
    case CS_Type.CS_ConnectAttempt: {
      connectionAttempt(lobby, data);
      break;
    }

    // Client changes their readiness state
    case CS_Type.CS_ReadyChange: {
      const client = lobby.clients.find((client) => client.id == data.userId);
      if (client) {
        client.ready = data.ready;
        log(`Client ${client.id} changed ready to: ${client.ready}`);
      }
      break;
    }

    // DEV mode, should be removed late, Client commands state to be set to Loading
    case CS_Type.CS_DEV_StartLoading: {
      lobby.setState(LobbyStateEnum.Loading);
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
 * @brief Returns a new slot number, that is as low as possible, but not yet taken
 * @param clients Clients who block slots
 */
function getNextSlot(clients: Array<Client>): number {
  let lowest = 0;
  clients.forEach((client) => {
    if (client.slot <= lowest) lowest++;
  });
  return lowest;
}

/**
 * @brief Called when a new Client wants to connect to the Lobby
 * The client gives their id, which they should get from being signed in,
 * and awaits a response from the Server, wether they are accepted or not
 * @param lobby relevant Lobby
 * @param data packet with data
 */
function connectionAttempt(lobby: Lobby, data: CS_ConnectAttempt) {
  // Check if Client tries to double connect
  if (lobby.clients.find((client) => client.id == data.userId) != undefined) {
    lobby.msgToClient<SC_ConnectFail>(SC_Type.SC_ConnectFail, {
      userId: data.userId,
      msg: `Cannot join, a user with your id is already in that Lobby`,
    });
    return;
  }

  // Check if enough slots are open, if not, then reject
  if (lobby.clients.length > LOBBY_MAX_SLOTS) {
    lobby.msgToClient<SC_ConnectFail>(SC_Type.SC_ConnectFail, {
      userId: data.userId,
      msg: `Cannot join full Lobby (${lobby.clients.length}/${LOBBY_MAX_SLOTS})`,
    });
    return;
  }

  // Generate earliest slot for Player
  const slot = getNextSlot(lobby.clients);

  // Confirm Connection success
  lobby.msgToClient<SC_ConnectSuccess>(SC_Type.SC_ConnectSuccess, {
    userId: data.userId,
    slot: slot,
  });

  // Add the new Client to Lobby
  const new_client: Client = {
    id: data.userId,
    name: data.name,
    slot: slot,
    socketId: data.socketId,
    loading: {
      progress: 0,
      msg: '',
      done: false,
      failed: false,
    },
    ready: false,
  };
  resetClient(new_client);
  log(
    `New Client connected: id:${new_client.id}, name: ${new_client.name}, slot:${new_client.slot}, socketId:${new_client.socketId}`,
  );
  lobby.clients.push(new_client);

  // Mock logic for disconnection of last client CHANGE LATER
  if (lobby.state == LobbyStateEnum.Game) {
    lobby.setState(LobbyStateEnum.EndScreen);
  }

  // Just make a new Game, so we can debug easier. Needs to be CHANGED later on!!
  lobby.msgToClient<SC_GenericStatePacket>(
    translateLobbyState(lobby.state),
    {},
  );
}
