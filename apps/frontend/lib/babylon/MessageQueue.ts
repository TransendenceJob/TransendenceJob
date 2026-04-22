//@ts-ignore
import { SC_GenericPacket } from '../../shared/packets/ServerClientPackets'

export class MessageQueue {
	private queue: Array<SC_GenericPacket>;
	private buffer: Array<SC_GenericPacket>;
	private lobbyId: number;
	private lastSeq: number | undefined;
	constructor(lobbyId: number) {
		this.queue = new Array();
		this.buffer = new Array();
		this.lobbyId = lobbyId;
		this.lastSeq = undefined;
	}

	write(payload: string) {
		console.log("Writing packet to queue: ", payload);
		let object: SC_GenericPacket;
		try {
			object = JSON.parse(payload);
		} catch (e) {
			console.warn(`Babylon: Error while parsing: ${payload}`);
			return ;
		}
		if (!object.type || !object.lobbyId || !object.seq || object.lobbyId != this.lobbyId)
			return ;

		if (!this.lastSeq)
			this.lastSeq = object.seq[0] - 1;

		// Put in buffer and sort buffer
		this.buffer.push(object);
		this.buffer.sort((a, b) => a.seq[0] - b.seq[0]);

		// Move handleable buffer into queue
		while (this.buffer.length > 0 && this.lastSeq && this.buffer[0].seq[0] == this.lastSeq + 1) {
			const nextPacket = this.buffer.shift()!;
			this.queue.push(nextPacket);
			this.lastSeq = nextPacket.seq[nextPacket.seq.length - 1];
		}
	}

	read(): Array<SC_GenericPacket> {
		if (this.queue.length == 0) 
			return [];
		const copy: Array<SC_GenericPacket> = [...this.queue];
		this.queue = [];
		return (copy);
	}
}