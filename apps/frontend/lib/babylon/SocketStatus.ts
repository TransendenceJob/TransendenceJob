// @ts-ignore
import { AdvancedDynamicTexture, TextBlock } from '@babylonjs/gui';

export class SocketStatus {
	private guiRef: AdvancedDynamicTexture;
	private obj: TextBlock;
	constructor(gui: AdvancedDynamicTexture, canvas: HTMLCanvasElement) {
		this.guiRef = gui;
		this.obj = new TextBlock("socket_status", "Disconnected");
		const fontSizeValue = 18;
		this.obj.fontSize = fontSizeValue;
		this.obj.color = "red";
		this.obj.left =  (canvas.width / 2) - gui.getContext().measureText(this.obj.text).width - 25;
		this.obj.top =  -1 * ((canvas.height) * 0.345);
		gui.addControl(this.obj);
	}

	set(connected: boolean) {
		if (connected) {
			this.obj.text = "Connected";
			this.obj.color = "green";
		}
		else {
			this.obj.text = "Disconnected";
			this.obj.color = "red";
		}
	}

	dispose() {
		this.obj.dispose();
	}

}