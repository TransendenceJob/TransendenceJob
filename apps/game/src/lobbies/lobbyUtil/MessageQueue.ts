import { CS_GenericPacket } from '@/shared/packets/ClientServerPackets';

/**
 * Class that administrates the comunication from Client->Server
 * Needs to exist to minimize effects off async on game order
 * @param queue Internal Queue of messages that should be handled ASAP
 */
export class MessageQueue {
  private queue: Array<CS_GenericPacket>;
  constructor() {
    this.queue = [];
  }

  /**
   * Writes a new packet to the internal queue, if it is valid
   * @param string already parsed object
   */
  write(object: CS_GenericPacket) {
    // Put in queue
    this.queue.push(object);
  }

  /**
   * Clears the internal queue of packets
   * @returns Copy of packets to be handled
   */
  read(): Array<CS_GenericPacket> {
    if (this.queue.length == 0) return [];
    const copy: Array<CS_GenericPacket> = [...this.queue];
    this.queue = [];
    return copy;
  }

  dispose() {}
}
