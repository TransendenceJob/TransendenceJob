import { AdvancedDynamicTexture, Button} from "@babylonjs/gui";
import { Scene } from "@babylonjs/core";
import { CS_Type, CS_DEV_StartEndscreen, CS_DEV_ButtonPress, CS_IWIN } from "@/shared/packets/ClientServerPackets"

import { setButtonSize, setButtonPos } from '../util/guiUtil';
import type { msgToServerType } from '@/lib/packets/msgToServerType';
import { stateUi } from '../state/state_ui/stateUi';
import { GameNotifications } from "../gui/GameNotifications";
import { SocketStatus } from "./SocketStatus";

export class GuiHelper {
	public socketStatus: SocketStatus;
	public textGui: AdvancedDynamicTexture;
	public buttonGui: AdvancedDynamicTexture;
	public notifications: GameNotifications;
	private resizeFunctions: Array<() => void> = [];
	constructor(
		scene: Scene, 
		canvas: HTMLCanvasElement,
		clientId: string,
		msgToServer: msgToServerType
	) {
		const count = 0;
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
		this.resizeFunctions.push(() => this.socketStatus.resize());

		// DEV TOOL sends packet to move to next state of Frontend Pages
		const endGameButton = Button.CreateSimpleButton("endGame", "End Game");
		endGameButton.color = "#FFF";
		endGameButton.onPointerUpObservable.add(() => {
			msgToServer<CS_DEV_StartEndscreen>(CS_Type.CS_DEV_StartEndscreen, {
				won: false,
				winnerId: clientId,
			});
		});
		this.resizeFunctions.push(() => {
			setButtonSize(endGameButton, canvas, 0.2, 0.2);
			setButtonPos(endGameButton, canvas, -1, 0.5);
		})
		this.buttonGui.addControl(endGameButton);

		// Yes, this is truly the pinnacle of gaming, 20 lines of code: Cookie Clicker
		let cookieCount = 0;
		const cookieLimit = 10;
		// DEV TOOL sends packet to move to next state of Frontend Pages
		const cookies = Button.CreateSimpleButton("endGame", "Click me!");
		cookies.color = "#FFF";
		cookies.onPointerUpObservable.add(() => {
			cookieCount++;
			if (cookies.textBlock)
				cookies.textBlock.text = `Cookies: ${cookieCount}/${cookieLimit}`;
			if (cookieCount >= cookieLimit)
				msgToServer<CS_IWIN>(CS_Type.CS_IWIN, {
					won: true,
					clientId: clientId,
			});
		});
		this.resizeFunctions.push(() => {
			setButtonSize(cookies, canvas, 0.1, 0.1);
			setButtonPos(cookies, canvas, -1, -1);
		})
		this.buttonGui.addControl(cookies);

		// DEV TOOL set up menu for switching between states 
		this.resizeFunctions.push(stateUi(this.textGui, this.buttonGui, canvas, msgToServer));

		// Set up Game Notification UI element
		this.notifications = new GameNotifications(this.textGui, canvas, scene);

		// FOR DEBUGGING ONLY! Remove this line later on.
		this.notifications.start();
		this.resize();
	}

	/**
	 * Goes through all registered functions for resizing the existing UI
	 */
	resize() {
		this.resizeFunctions.forEach((func) => { 
			func()
		});
	}

	dispose() {
		this.socketStatus.dispose();
		this.textGui.dispose();
		this.buttonGui.dispose();
		this.notifications.dispose();
		this.resizeFunctions = []
	}
}
