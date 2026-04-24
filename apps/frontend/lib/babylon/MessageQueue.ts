//@ts-ignore
import { SC_GenericPacket } from '../../shared/packets/ServerClientPackets'
// @ts-ignore
import { Socket } from 'socket.io-client';
import { StateMachine } from './state/StateMachine';

/**
 * Class that administrates the comunication from Server->Client
 * @param queue Internal Queue of messages that should be handled ASAP
 * @param buffer Internal buffer of unsorted messages that arrived out of order
 * @param lobbyId identifer for this lobby, checked when packet arrives
 * @param lastSeq Internal reference to the latest valid seq parameter received via packet
 * @param cleanup Returns function to clean up listeners from the socket
 */
export class MessageQueue {
	private queue: Array<SC_GenericPacket>;
	private buffer: Array<SC_GenericPacket>;
	private lobbyId: number;
	private lastSeq: number | undefined;
	public dispose: () => void;
	public updateSocketUi: () => void;
	public log: (data: string) => void;
	constructor(lobbyId: number, socket: Socket, state: StateMachine, DEBUG: boolean, log: (data: string) => void) {
		this.queue = new Array();
		this.buffer = new Array();
		this.lobbyId = lobbyId;
		this.lastSeq = undefined;
		this.log = log;

		const setSocketConnected = (connected: boolean) => {
			state.guiHelper?.socketStatus?.set(connected);
		}
		const addNotification = (message: string) => {
			state.guiHelper?.notifications?.add(message);
		}

		// Because the UI is created after the socket, we need to add a function,
		// that can be called later to update the UI about the sockets state
		this.updateSocketUi = () => {
			if (socket && socket.connected) {
				setSocketConnected(true);
			}
		}

		const onConnect = () => {
			setSocketConnected(true);
			//log(DEBUG, "Connected to Backend");
			if (DEBUG) addNotification("Connected to Backend");
		};
		socket.on("connect", onConnect);
				
		const onError = (error: Error) => {
			setSocketConnected(false);
			//log(DEBUG, `Error with websocket: ${error.message}`);
			if (DEBUG) addNotification(`Error with websocket: ${error.message}`);
		};
		socket.on("connect_error", onError);
		
		const onDisconnect = () => {
			setSocketConnected(false);
			//log(DEBUG, "Connection closed");
			if (DEBUG) addNotification("Connection closed");
		}
		socket.on("disconnect", onDisconnect);

		const msgToClient = (data: string) => {
			//log(DEBUG, `Message from server ${data}`);
			if (DEBUG) addNotification(`Message from server ${data}`);
			this.write(data);
		}
		socket.on("msgToClient", msgToClient);


		this.dispose = () => {
				if (DEBUG) console.log("Sockets have been cleaned up!");
				socket.off("connect", onConnect);
				socket.off("msgToClient", msgToClient);
				socket.off("connect_error", onError);
				socket.off("disconnect", onDisconnect);
		};
	}

	/**
	 * Writes a new packet to the internal queue, if it is valid
	 * @param string raw string of the packet to be JSON.parse()d
	 */
	write(payload: string) {
		let object: SC_GenericPacket;
		try {
			object = JSON.parse(payload);
		} catch (e) {
			console.warn(`Babylon: Error while parsing: ${payload}`);
			return ;
		}
		if (!object.type || object.lobbyId == undefined || !object.seq || object.lobbyId != this.lobbyId) {
			console.warn("Babylon: Error: Packet had invalid parameters: ", object);
			return ;
		}

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

	/**
	 * Clears the internal queue of packets
	 * @returns Copy of packets to be handled
	 */
	read(): Array<SC_GenericPacket> {
		if (this.queue.length == 0) 
			return [];
		const copy: Array<SC_GenericPacket> = [...this.queue];
		this.queue = [];
		return (copy);
	}

}