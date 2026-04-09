// @ts-ignore
import { Socket } from 'socket.io-client';
// @ts-ignore
import { AdvancedDynamicTexture } from '@babylonjs/gui'

import { log } from "./log";

/**
 * Sets up the listeners for socket events
 * @param socket socket to listen on
 * @param gui Gui that holds elements that react to changes in socket
 * @param DEBUG boolean wether messages should be logged
 * @returns Function to take listeners off socket
 */
export default function setupSocket(
	socket: Socket, 
	gui: AdvancedDynamicTexture, 
	DEBUG: boolean) {
	const socket_status = gui.getControlByName("socket_status") as any;
	const receiveButton = gui.getControlByName("receive") as any;

	if (!socket_status || !receiveButton) {
		log(DEBUG, "GUI Controls not found");
		return;
	}

	if (socket && socket.connected)
	{
		log(DEBUG, "Connection established");
		socket_status.text = "Connection Status: Connected";
		socket_status.color = "green";
	}

	const onConnect = () => {
		log(DEBUG, "Connected to Backend");
		socket_status.text = "Connection Status: Connected";
		socket_status.color = "green";
	};
	socket.on("connect", onConnect);
	
	const msgToClient = (data: string) => {
		log(DEBUG, `Message from server ${data}`);
		const dataObj = JSON.parse(data);
		receiveButton.textBlock.text = "Received: [" + JSON.stringify(dataObj) + "]";
	}
	socket.on("msgToClient", msgToClient);
	
	const onError = (error: Error) => {
		log(DEBUG, `Error with websocket: ${error.message}`);
		socket_status.text = "Connection Status: Errror";
		socket_status.color = "red";
	};
	socket.on("connect_error", onError);
	
	const onDisconnect = () => {
		log(DEBUG, "Connection closed");
		socket_status.text = "Connection Status: Disconnected";
		socket_status.color = "red";
	}
	socket.on("disconnect", onDisconnect);

	return () => {
		console.log("Sockets have been cleaned up!");
		socket.off("connect", onConnect);
		socket.off("msgToClient", msgToClient);
		socket.off("connect_error", onError);
		socket.off("disconnect", onDisconnect);
	};
}