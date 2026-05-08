import { CS_GenericPacket } from '@/shared/packets/ClientServerPackets';
import { Lobby } from '../../Lobby';
import { LobbyStateEnum } from '../LobbyStateEnum';
import { handleLobbyPackets } from './handleLobbyPackets';
import { handleLoadingPackets } from './handleLoadingPackets';
import { handleGamePackets } from './handleGamePackets';
import { tickLoading } from './tickLoading';
import { tickLobby } from './tickLobby';

const DEBUG_OUTPUT = true;
const log = DEBUG_OUTPUT
  ? (msg: string) => {
      console.log('DEBUG: ', msg);
    }
  : (msg: string) => {};

/**
 * @brief Handles packages from queue, tries to handle all at once
 * @param lobby Lobby that this is for
 */
export function handlePackets(lobby: Lobby) {
  const packetList: Array<CS_GenericPacket> = lobby.queue.read();
  packetList.forEach((data: CS_GenericPacket) => {
    switch (lobby.state) {
      // Lobby is in Lobby state
      case LobbyStateEnum.OpenLobby: {
        handleLobbyPackets(lobby, data);
        tickLobby(lobby, log);
        break;
      }

      // Lobby is in Loading state
      case LobbyStateEnum.Loading: {
        handleLoadingPackets(lobby, data);
        tickLoading(lobby, log);
        break;
      }

      // Lobby is in Game state
      case LobbyStateEnum.Game: {
        handleGamePackets(lobby, data);
        break;
      }
    }
  });
}
