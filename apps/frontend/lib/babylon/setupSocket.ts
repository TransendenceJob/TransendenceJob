// @ts-ignore
import { Socket } from 'socket.io-client';
// @ts-ignore
import { AdvancedDynamicTexture } from '@babylonjs/gui'

import { log } from "./log";
import { GameNotifications } from './notifications/GameNotifications';
import { handlePacket } from './handlePacket';
import { StateMachine } from './state/StateMachine';
import { MessageQueue } from './MessageQueue';


/**
 * Sets up the listeners for socket events
 * @param socket socket to listen on
 * @param gui Gui that holds elements that react to changes in socket
 * @param DEBUG boolean wether messages should be logged
 * @returns Function to take listeners off socket
 */
export default function setupSocket(
	socket: Socket, 
	state: StateMachine,
	queue: MessageQueue,
	DEBUG: boolean
) {
	const socket_status = state.guiHelper?.textGui.getControlByName("socket_status") as any;
	const notifications = state.guiHelper?.notifications;
	const textGui = state.guiHelper?.textGui;

	if (!socket_status || !notifications || !textGui) {
		log(DEBUG, "GUI Controls not found");
		return;
	}

	if (socket && socket.connected)
	{
		log(DEBUG, "Connection established");
		socket_status.text = "Connected";
		socket_status.color = "green";
	}

	const onConnect = () => {
		log(DEBUG, "Connected to Backend");
		socket_status.text = "Connected";
		socket_status.color = "green";
		if (DEBUG && notifications) notifications.add("Connected to Backend");
	};
	socket.on("connect", onConnect);
	
	const msgToClient = (data: string) => {
		log(DEBUG, `Message from server ${data}`);
		if (DEBUG && notifications) notifications.add(`Message from server ${data}`);
		queue.write(data);
	}
	socket.on("msgToClient", msgToClient);
	
	const onError = (error: Error) => {
		log(DEBUG, `Error with websocket: ${error.message}`);
		socket_status.text = "Errror";
		socket_status.color = "red";
		if (DEBUG && notifications) notifications.add(`Error with websocket: ${error.message}`);
	};
	socket.on("connect_error", onError);
	
	const onDisconnect = () => {
		log(DEBUG, "Connection closed");
		socket_status.text = "Disconnected";
		socket_status.color = "red";
		if (DEBUG && notifications) notifications.add("Connection closed");
	}
	socket.on("disconnect", onDisconnect);

	return () => {
		if (DEBUG) console.log("Sockets have been cleaned up!");
		socket.off("connect", onConnect);
		socket.off("msgToClient", msgToClient);
		socket.off("connect_error", onError);
		socket.off("disconnect", onDisconnect);
	};
}