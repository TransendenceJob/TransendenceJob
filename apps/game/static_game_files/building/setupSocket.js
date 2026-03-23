export function setupSocket(socket, gui) {
	const socket_status = gui.getControlByName("socket_status");
	const receiveButton = gui.getControlByName("receive");

	socket.on("connect", () => {
		console.log("Connected to Backend");
		socket_status.text = "Connection Status: Connected";
		socket_status.color = "green";
	});
	
	socket.on("msgToClient", (data) => {
		console.log(`Message from server ${data}`);
		const dataObj = JSON.parse(data);
		receiveButton.textBlock.text = "Received: [" + JSON.stringify(dataObj) + "]";
	});
	
	socket.on("connect_error", (error) => {
		console.log("Error with websocket: ", error);
		socket_status.text = "Connection Status: Errror";
		socket_status.color = "red";
	});
	
	socket.on("disconnect", () => {
		console.log("Connection closed");
		socket_status.text = "Connection Status: Disconnected";
		socket_status.color = "red";
	});

	return (socket);
}