import { Injectable } from '@nestjs/common';
import { Lobby } from './Lobby';
import type { Response } from 'express';
import { EventEmitter } from 'stream';

/**
 * Service that administrates multiple lobbies at the same time
 * Since we only plan on using 1, this is just passing stuff through
 */

@Injectable()
export class LobbyManager extends EventEmitter {
  private lobbies: Lobby[];
  constructor() {
    super();
    const amount = 1;
    this.lobbies = new Array<Lobby>(amount);
    // Set up Lobby with a callback to send data to Socket via EventEmitter inherited func
    for (let i = 0; i < amount; i++) {
      this.lobbies[i] = new Lobby(i, (payload: string) => {
        this.emit('dataToEmit', payload);
      });
    }
  }

  /**
   * @brief Get Page to be displayed for Lobby
   * @param res Response that needs to be set
   */
  servePage(res: Response) {
    this.lobbies[0].servePage(res);
  }

  /**
   * @brief Send Client Websocket packet to Server
   * @param data Raw string of packet, should be in json format
   */
  msgToServer(data: string) {
    this.lobbies[0].msgToServer(data);
  }
}
