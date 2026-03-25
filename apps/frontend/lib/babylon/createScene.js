import {
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
} from "@babylonjs/core";
import {
  AdvancedDynamicTexture,
  TextBlock,
  Button,
} from "@babylonjs/gui";

function setButtonSize(button, canvas, size_x, size_y)
{
	button.widthInPixels = canvas.width * size_x;
	button.heightInPixels = canvas.height * size_y;
}

function setButtonPos(button, canvas, pos_x, pos_y)
{
	button.left =  pos_x * ((canvas.width - button.widthInPixels) / 2);
	button.top =  pos_y * ((canvas.height - button.heightInPixels) / 2);
}

function setupSocket(socket, gui) {
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

function createGui(scene, canvas, socket)
{
	let count = 0;
	const gui = AdvancedDynamicTexture.CreateFullscreenUI(
		"GUI",
		true,
		scene,
	);

	const socket_status = new TextBlock("socket_status", "Connection Status: Disconnected");
	socket_status.fontSize = 24;
	socket_status.color = "red";
	const size = socket_status.fontSize.replace('px', '');
	socket_status.top =  -1 * ((canvas.height - size) / 2);
	gui.addControl(socket_status);

	const receiveButton = Button.CreateSimpleButton("receive", "No Messages received");
	setButtonSize(receiveButton, canvas, 0.8, 0.2);
	setButtonPos(receiveButton, canvas, 1, 1);
	receiveButton.color = "#FFF";
	gui.addControl(receiveButton);

	const button = Button.CreateSimpleButton("send", "SEND");
	setButtonSize(button, canvas, 0.2, 0.2);
	setButtonPos(button, canvas, -1, 1);
	button.color = "#FFF";
	button.onPointerUpObservable.add(() => {
		count++;
		const data = {
			type: "User clicked",
			timestamp: Date.now(),
			message: `User pressed button for the ${count} time`,
			};
			if (socket && socket.connected) {
				socket.emit('msgToServer', JSON.stringify(data));
			} else {
				console.warn("No Websocket Connection established");
			}
		})
	gui.addControl(button);

	return (gui)
}

export async function createScene(canvas, engine, socket) {
	var scene = new Scene(engine);
	var camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
	camera.setTarget(Vector3.Zero());
	var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
	light.intensity = 0.7;

	const gui = createGui(scene, canvas, socket);
	setupSocket(socket, gui);

	return scene;
};
