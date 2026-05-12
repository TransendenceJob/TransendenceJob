import {
  CS_ConnectAttempt,
  CS_GenericPacket,
  CS_Type,
  CS_JoinLobby
} from '@/shared/packets/ClientServerPackets';
import {
  SC_ConnectFail,
  SC_ConnectSuccess,
  SC_GenericStatePacket,
  SC_Type,
  SC_LobbyData,
  SC_ReadyChange
} from '@/shared/packets/ServerClientPackets';
import { Client, makeClient, resetClient } from '@/shared/packets/Client';
import { Lobby } from 'src/lobbies/Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';
import { translateLobbyState } from '../translateLobbyState';
import { log } from 'src/lobbies/lobbyUtil/log';

const LOBBY_MAX_SLOTS = 4;

export function handleLobbyPackets(lobby: Lobby, data: CS_GenericPacket) {
  switch (data.type) {
    // New Client wants to connect
    /*
    case CS_Type.CS_ConnectAttempt: {
      connectionAttempt(lobby, data);
      break;
    }
    */
    
    case CS_Type.CS_JoinLobby: {
      connectionAttempt(lobby, data);
      break;
    }

    // Client changes their readiness state
    case CS_Type.CS_ReadyChange: {
      const client = lobby.clients.find((client) => client.id == data.userId);
      if (!client)
        return ;
      client.ready = data.ready;
      log(`Client ${client.id} changed ready to: ${client.ready}`);
      lobby.msgToClient<SC_ReadyChange>(SC_Type.SC_ReadyChange, {userId: client.id, ready: data.ready});
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
 * @brief Called when a new Client wants to connect to the Lobby
 * The client gives their id, which they should get from being signed in,
 * and awaits a response from the Server, wether they are accepted or not
 * @param lobby relevant Lobby
 * @param data packet with data
 */
function connectionAttempt(lobby: Lobby, data: CS_JoinLobby) {
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


  // Add the new Client to Lobby
  const new_client: Client = makeClient(data.userId, data.userName, lobby.clients);
  lobby.clients.push(new_client);
  log(
    `New Client connected: id:${new_client.id}, name: ${new_client.name}, slot:${new_client.slot}`,
  );

  // Confirm Connection success
  /*
  lobby.msgToClient<SC_ConnectSuccess>(SC_Type.SC_ConnectSuccess, {
    userId: data.userId,
    slot: slot,
  });
  */
  
  // Create SC_LobbyData packet to sync the frontend
  lobby.msgToClient<SC_LobbyData>(
    SC_Type.SC_LobbyData,
    {
      userId: data.userId,
      lobbyData: lobby.clients
    }
  );
  lobby.clients.push(new_client);

  // This is just a temporary solution, for when the server is in the game state, 
  // and all players have left, which sets it back to the Lobby,
  // because we do not have logic for the server to automatically reset itself on last disconnect
  // Needs to be CHANGED later on!!
  console.log("Invoking Dev Mode Logic, resetting Game back to Lobby, because Client wants to join midgame");
  if (lobby.state == LobbyStateEnum.Game) {
    lobby.setState(LobbyStateEnum.EndScreen);
  }
  lobby.msgToClient<SC_GenericStatePacket>(
    translateLobbyState(lobby.state),
    {},
  );
}
