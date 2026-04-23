// @ts-ignore
import { AdvancedDynamicTexture, TextBlock, Button} from "@babylonjs/gui";
// @ts-ignore
import { Scene } from "@babylonjs/core";
// @ts-ignore
import { CS_Type, CS_DEV_StartEndscreen, CS_DEV_ButtonPress, CS_GetGameState } from "../../shared/packets/ClientServerPackets"

import { setButtonSize, setButtonPos } from './util/guiUtil';
import type { msgToServerType } from '../packets/msgToServerType';
import { stateUi } from './state/stateUi';
import { GameNotifications } from "./notifications/GameNotifications";
import { SocketStatus } from "./SocketStatus";

export class GuiHelper {
	public socketStatus: SocketStatus;
	public textGui: AdvancedDynamicTexture;
	public buttonGui: AdvancedDynamicTexture;
	public notifications: GameNotifications;
	constructor(
		scene: Scene, 
		canvas: HTMLCanvasElement,
		msgToServer: msgToServerType
	) {
		let count = 0;
		// Text hitboxes may overlap with buttons and take over control

		// GUI for non-interactable text
		this.textGui = AdvancedDynamicTexture.CreateFullscreenUI(
			"TextGUI",
			true,
			scene,
		);
		// GUI for interactable buttons
		this.buttonGui = AdvancedDynamicTexture.CreateFullscreenUI(
			"ButtonGUI",
			true,
			scene,
		);

		// Text that displays the status of the socket connection
		this.socketStatus = new SocketStatus(this.textGui, canvas);

		// DEV TOOL sends packet to move to next state of Frontend Pages
		const endGameButton = Button.CreateSimpleButton("endGame", "End Game");
		setButtonSize(endGameButton, canvas, 0.2, 0.2);
		setButtonPos(endGameButton, canvas, -1, 0.5);
		endGameButton.color = "#FFF";
		endGameButton.onPointerUpObservable.add(() => {
			msgToServer<CS_DEV_StartEndscreen>(CS_Type.CS_DEV_StartEndscreen, {});
		});
		this.buttonGui.addControl(endGameButton);

		// DEV TOOL sends packet to move to next state of Frontend Pages
		const sendButton = Button.CreateSimpleButton("send", "SEND");
		setButtonSize(sendButton, canvas, 0.2, 0.2);
		setButtonPos(sendButton, canvas, -1, 1);
		sendButton.color = "#FFF";
		sendButton.onPointerUpObservable.add(() => {
			count++;
			msgToServer<CS_DEV_ButtonPress>(CS_Type.CS_DEV_ButtonPress, {
				timestamp: Date.now(),
				message: `User pressed sendButton for the ${count} time`,
			});
		});
		this.buttonGui.addControl(sendButton);

		// DEV TOOL set up menu for switching between states 
		stateUi(this.textGui, this.buttonGui, canvas, msgToServer);

		// Set up Game Notification UI element
		this.notifications = new GameNotifications(this.textGui, canvas.height, scene);
		// msgToServer<CS_GetGameState>(CS_Type.CS_GetGameState, {});
	}
}
