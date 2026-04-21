// @ts-ignore
import { AdvancedDynamicTexture, TextBlock, Button} from "@babylonjs/gui";
// @ts-ignore
import { Scene } from "@babylonjs/core";
import { CS_Type, CS_DEV_StartEndscreen, CS_DEV_ButtonPress, CS_GetGameState } from "../../shared/packets/ClientServerPackets"

import { setButtonSize, setButtonPos } from './util/guiUtil';
import type { msgToServerType } from '../packets/msgToServerType';
import { stateUi } from './stateMachine/stateUi';
import { GameNotifications } from "./notifications/GameNotifications";

export default function createGui(
	scene: Scene, 
	canvas: HTMLCanvasElement,
	msgToServer: msgToServerType
): {
		textGui: AdvancedDynamicTexture, 
		buttonGui: AdvancedDynamicTexture,
		notifications: GameNotifications
} {
	let count = 0;
	// Text hitboxes may overlap with buttons and take over control
	const textGui = AdvancedDynamicTexture.CreateFullscreenUI(
		"TextGUI",
		true,
		scene,
	);
	const buttonGui = AdvancedDynamicTexture.CreateFullscreenUI(
		"ButtonGUI",
		true,
		scene,
	);

	const socket_status = new TextBlock("socket_status", "Disconnected");
	const fontSizeValue = 18;
	socket_status.fontSize = fontSizeValue;
	socket_status.color = "red";
	const size = fontSizeValue;
	socket_status.left =  (canvas.width / 2) - textGui.getContext().measureText(socket_status.text).width - 25;
	socket_status.top =  -1 * ((canvas.height) * 0.345);
	textGui.addControl(socket_status);

	// only exists for development, and moving through states by force
	const endGameButton = Button.CreateSimpleButton("endGame", "End Game");
	setButtonSize(endGameButton, canvas, 0.2, 0.2);
	setButtonPos(endGameButton, canvas, -1, 0.5);
	endGameButton.color = "#FFF";
	endGameButton.onPointerUpObservable.add(() => {
		msgToServer<CS_DEV_StartEndscreen>(CS_Type.CS_DEV_StartEndscreen, {});
	});
	buttonGui.addControl(endGameButton);

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
	buttonGui.addControl(button);

	stateUi(textGui, buttonGui, canvas, msgToServer);
	const notifications = new GameNotifications(textGui, canvas.height, scene);
	msgToServer<CS_GetGameState>(CS_Type.CS_GetGameState, {});

	return ({textGui, buttonGui, notifications})
}
