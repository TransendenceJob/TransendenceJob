// @ts-ignore
import { AdvancedDynamicTexture, TextBlock, Button} from "@babylonjs/gui";
// @ts-ignore
import { Scene } from "@babylonjs/core";
// @ts-ignore
import { CS_Type, CS_DEV_StartEndscreen, CS_DEV_ButtonPress } from "../../shared/packets/ClientServerPackets"

import { setButtonSize, setButtonPos } from './guiUtil';
import type { msgToServerType } from '../packets/msgToServerType';

export default function createGui(
	scene: Scene, 
	canvas: HTMLCanvasElement,
	msgToServer: msgToServerType
): AdvancedDynamicTexture {
	let count = 0;
	const gui = AdvancedDynamicTexture.CreateFullscreenUI(
		"GUI",
		true,
		scene,
	);

	const socket_status = new TextBlock("socket_status", "Connection Status: Disconnected");
	const fontSizeValue = 24;
	socket_status.fontSize = fontSizeValue;
	socket_status.color = "red";
	const size = fontSizeValue;
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
		msgToServer<CS_DEV_StartEndscreen>(CS_Type.CS_DEV_StartEndscreen, {});
	});
	gui.addControl(endGameButton);

	const button = Button.CreateSimpleButton("send", "SEND");
	setButtonSize(button, canvas, 0.2, 0.2);
	setButtonPos(button, canvas, -1, 1);
	button.color = "#FFF";
	button.onPointerUpObservable.add(() => {
		count++;
		msgToServer<CS_DEV_ButtonPress>(CS_Type.CS_DEV_ButtonPress, {
			timestamp: Date.now(),
			message: `User pressed button for the ${count} time`,
		});
	});
	gui.addControl(button);

	return (gui)
}
