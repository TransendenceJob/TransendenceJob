import {
  AdvancedDynamicTexture,
  TextBlock,
  Button,
} from "@babylonjs/gui";
import {
	CS_Type,
	CS_DEV_StartEndscreen,
	CS_DEV_ButtonPress
} from "../../shared/packets/ClientServerPackets"

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

export default function createGui(scene, canvas, socket)
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

	// only exists for development, and moving through states by force
	const endGameButton = Button.CreateSimpleButton("endGame", "End Game");
	setButtonSize(endGameButton, canvas, 0.2, 0.2);
	setButtonPos(endGameButton, canvas, -1, 0.5);
	endGameButton.color = "#FFF";
	endGameButton.onPointerUpObservable.add(() => {
		const data = {
			type: CS_Type.CS_DEV_StartEndscreen,
			// will need to be handled correctly
			lobbyId: 0,
		};
		if (socket && socket.connected) {
			socket.emit('msgToServer', JSON.stringify(data));
		}
	});
	gui.addControl(endGameButton);


	const button = Button.CreateSimpleButton("send", "SEND");
	setButtonSize(button, canvas, 0.2, 0.2);
	setButtonPos(button, canvas, -1, 1);
	button.color = "#FFF";
	button.onPointerUpObservable.add(() => {
		count++;
		const data = {
			type: CS_Type.CS_DEV_ButtonPress,
			timestamp: Date.now(),
			message: `User pressed button for the ${count} time`,
			// will need to be handled correctly
			lobbyId: 0,
		};
		if (socket && socket.connected) {
			socket.emit('msgToServer', JSON.stringify(data));
		}
	})
	gui.addControl(button);

	return (gui)
}
