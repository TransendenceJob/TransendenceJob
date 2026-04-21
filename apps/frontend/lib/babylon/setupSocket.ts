// @ts-ignore
import { Socket } from 'socket.io-client';
// @ts-ignore
import { AdvancedDynamicTexture } from '@babylonjs/gui'

import { log } from "./log";
import { GameNotifications } from './notifications/GameNotifications';
import { handlePacket } from './handlePacket';
import { StateMachine } from './state/StateMachine';


/**
 * Sets up the listeners for socket events
 * @param socket socket to listen on
 * @param gui Gui that holds elements that react to changes in socket
 * @param DEBUG boolean wether messages should be logged
 * @returns Function to take listeners off socket
 */
export default function setupSocket(
	socket: Socket, 
	gui: {
		textGui: AdvancedDynamicTexture, 
		buttonGui: AdvancedDynamicTexture,
		notifications: GameNotifications
	}, 
	state: StateMachine,
	DEBUG: boolean) {
	const socket_status = gui.textGui.getControlByName("socket_status") as any;

	if (!socket_status) {
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
		if (DEBUG) gui.notifications.add("Connected to Backend");
	};
	socket.on("connect", onConnect);
	
	const msgToClient = (data: string) => {
		log(DEBUG, `Message from server ${data}`);
		const dataObj = JSON.parse(data);
		handlePacket(dataObj, gui.textGui, state);
		if (DEBUG) gui.notifications.add(`Message from server ${data}`);
	}
	socket.on("msgToClient", msgToClient);
	
	const onError = (error: Error) => {
		log(DEBUG, `Error with websocket: ${error.message}`);
		socket_status.text = "Errror";
		socket_status.color = "red";
		if (DEBUG) gui.notifications.add(`Error with websocket: ${error.message}`);
	};
	socket.on("connect_error", onError);
	
	const onDisconnect = () => {
		log(DEBUG, "Connection closed");
		socket_status.text = "Disconnected";
		socket_status.color = "red";
		if (DEBUG) gui.notifications.add("Connection closed");
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