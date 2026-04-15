import { Injectable } from '@nestjs/common';
import { Lobby } from './Lobby';
import { EventEmitter } from 'stream';
import { Logger } from '@nestjs/common';
import { CS_GenericPacket } from '@/shared/packets/ClientServerPackets';

const DEBUG: boolean = process.env.NODE_ENV == 'development';

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

        if (DEBUG) this.logger.log(`Server->Client: ${payload}`);
      });
    }
  }

  /**
   * @brief Send Client Websocket packet to Server
   * @param data_raw Raw string of packet, should be in json format
   */
  msgToServer(data_raw: string) {
    const data: CS_GenericPacket = JSON.parse(data_raw);

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

    // Log
    if (DEBUG) this.logger.log(`Client->Server: ${data_raw}`);

    // Let appropriate lobby handle package
    this.lobbies[data.lobbyId].msgToServer(data);
  }
}
