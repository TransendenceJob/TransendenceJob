import { log } from "./log";

export default function setupSocket(socket, gui, msgToServer, DEBUG) {
	const socket_status = gui.getControlByName("socket_status");
	const receiveButton = gui.getControlByName("receive");

	if (socket && socket.connected)
	{
		log(DEBUG, "Connection established");
		socket_status.text = "Connection Status: Connected";
		socket_status.color = "green";
	}

	socket.on("connect", () => {
		log(DEBUG, "Connected to Backend");
		socket_status.text = "Connection Status: Connected";
		socket_status.color = "green";
	});
	
	socket.on("msgToClient", (data) => {
		log(DEBUG, `Message from server ${data}`);
		const dataObj = JSON.parse(data);
		receiveButton.textBlock.text = "Received: [" + JSON.stringify(dataObj) + "]";
	});
	
	socket.on("connect_error", (error) => {
		log(DEBUG, "Error with websocket: ", error);
		socket_status.text = "Connection Status: Errror";
		socket_status.color = "red";
	});
	
	socket.on("disconnect", () => {
		log(DEBUG, "Connection closed");
		socket_status.text = "Connection Status: Disconnected";
		socket_status.color = "red";
	});

	return (socket);
}