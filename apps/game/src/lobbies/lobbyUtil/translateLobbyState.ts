import { LobbyStateEnum } from './LobbyStateEnum';
import {
  SC_Type,
  SC_GenericStatePacket,
} from '@/shared/packets/ServerClientPackets';

/**
 * Translates Lobby State Enum to corresponding packet type,
 * to put Client into the corresponding state
 * @param state Lobbys State
 * @returns enum/string for Json packet type
 */
export function translateLobbyState(
  state: LobbyStateEnum,
): SC_GenericStatePacket['type'] {
  switch (state) {
    case LobbyStateEnum.OpenLobby:
      return SC_Type.SC_StartLobby;
    case LobbyStateEnum.Loading:
      return SC_Type.SC_StartLoading;
    case LobbyStateEnum.Game:
      return SC_Type.SC_StartGame;
    case LobbyStateEnum.EndScreen:
      return SC_Type.SC_GameFinished;
  }
  return SC_Type.SC_InvalidState;
}
