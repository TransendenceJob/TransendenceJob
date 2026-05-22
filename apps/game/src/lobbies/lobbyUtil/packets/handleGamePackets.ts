import {
  CS_GenericPacket,
  CS_Type,
} from '@/shared/packets/ClientServerPackets';
import { Lobby } from 'src/lobbies/Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';
import {
  SC_DEV_ButtonPress,
  SC_Type,
  SC_WormChosen,
  SC_ExplosionOccurs,
} from '@/shared/packets/ServerClientPackets';
import { pointData } from '@/shared/packets/util';
import { GameState } from '@/shared/state/GameState';

function requestChangeState(
  lobby: Lobby,
  userId: string,
  targetState: GameState,
) {
  if (lobby.clientManager.getActive().id != userId) return;
  // TODO: Add logic to verify, which user Requests a state change, and if its valid
  if (!lobby.game) return;
  lobby.game.setState(targetState);
}

export function handleGamePackets(lobby: Lobby, data: CS_GenericPacket) {
  switch (data.type) {
    // For the button to send to Server, just send back a copy
    case CS_Type.CS_DEV_ButtonPress: {
      if (lobby.clientManager.getActive().id != data.userId) break;
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

    // DEV MODE ONLY, Remove this later, the client should not be able to force anything
    // For when Client forces server to change state
    case CS_Type.CS_DEV_SetGameState: {
      if (!lobby.game) return;
      lobby.game.setState(data.state);
      break;
    }

    // When Client tells server that it thinks the server should change state
    case CS_Type.CS_RequestChangeGameState: {
      requestChangeState(lobby, data.userId, data.state);
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

    // When worms is locked in
    case CS_Type.CS_WormChosen: {
      // TODO should verify and store this, without naively accepting this
      lobby.msgToClient<SC_WormChosen>(SC_Type.SC_WormChosen, {
        wormId: data.wormId,
      });
      break;
    }

    // When aiming is locked in
    case CS_Type.CS_AimingDone: {
      // Do not allow non-active user to submit data
      if (lobby.clientManager.getActive().id != data.userId) return;
      const target = lobby.game.aimingData;
      target.position = data.position as pointData;
      target.angle = data.angle as number;
      target.force = data.force as number;
      requestChangeState(lobby, data.userId, GameState.TURN_END);
      // Placeholder logic for projectile handling: Worm fucking explodes
      lobby.msgToClient<SC_ExplosionOccurs>(SC_Type.SC_ExplosionOccurs, {
        point: data.position as pointData,
        radius: 3,
      });
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
