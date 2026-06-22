import { Injectable } from '@nestjs/common';
import { Lobby } from './Lobby';
import { EventEmitter } from 'stream';
import { Logger } from '@nestjs/common';
import {
  CS_GenericPacket,
  CS_Type,
  hideClientPackets,
} from '@/shared/packets/ClientServerPackets';
import {
  SERVER_LOG_CLIENT_PACKETS,
  SERVER_LOG_SERVER_PACKETS,
} from '@/shared/packets/config';
import {
  hideServerPackets,
  SC_Type,
} from '@/shared/packets/ServerClientPackets';

const DEBUG: boolean = true;
//process.env.NODE_ENV == 'development';

/**
 * Service that administrates multiple lobbies at the same time
 * Since we only plan on using 1, this is just passing stuff through
 */
@Injectable()
export class LobbyManager extends EventEmitter {
  private lobbies: Lobby[];
  private logger: Logger = new Logger('LobbyManger');
  constructor() {
    super();
    const amount = 1;
    this.lobbies = new Array<Lobby>(amount);
    // Set up Lobby with a callback to send data to Socket via EventEmitter inherited func
    for (let i = 0; i < amount; i++) {
      this.lobbies[i] = new Lobby(i, (payload: string) => {
        this.emit('dataToEmit', payload);

        const obj = JSON.parse(payload);
        const found = hideServerPackets.find(
          (type: SC_Type) => type == obj.type,
        );
        if (!found && SERVER_LOG_SERVER_PACKETS)
          this.logger.log(`Server->Client: ${payload}`);
      });
    }
  }

  /**
   * @brief Send Client Websocket packet to Server
   * @param data_raw Raw string of packet, should be in json format
   */
  msgToServer(data_raw: string) {
    const data: CS_GenericPacket = JSON.parse(data_raw) as CS_GenericPacket;

    // Check data.type
    if (data.type == undefined) {
      this.logger.log(
        `Error: Received packet without type parameter ${data_raw}`,
      );
      return;
    }

    // Check lobbyId
    if (
      data.lobbyId == undefined ||
      data.lobbyId > this.lobbies.length - 1 ||
      data.lobbyId < 0
    ) {
      this.logger.log(
        `Error: Received packet with invalid lobbyId parameter ${data_raw}`,
      );
      return;
    }

    // Log C->S packets
    const found: CS_Type | undefined = hideClientPackets.find(
      (type: CS_Type) => type == (data.type as CS_Type),
    );
    if (!found && SERVER_LOG_CLIENT_PACKETS)
      this.logger.log(`Client->Server: ${data_raw}`);

    // Let appropriate lobby handle package
    this.lobbies[data.lobbyId].msgToServer(data);
  }

  /**
   * Called when a socket connection is lost.
   * Finds the correct lobby and tells it to remove the user.
   */
  handleDisconnect(lobbyId: number, userId: string) {
    if (this.lobbies[lobbyId]) {
      this.logger.log(
        `Directing cleanup: User ${userId} from Lobby ${lobbyId}`,
      );

      // Call the cleanup function inside the specific Lobby instance
      this.lobbies[lobbyId].handleDisconnect(userId);
    }
  }
}
