// @ts-ignore
import { AdvancedDynamicTexture, TextBlock } from '@babylonjs/gui';

export class SocketStatus {
	private guiRef: AdvancedDynamicTexture;
	private obj: TextBlock;
	private canvasRef: HTMLCanvasElement;
	private fontSize: number;
	constructor(gui: AdvancedDynamicTexture, canvas: HTMLCanvasElement) {
		this.guiRef = gui;
		this.canvasRef = canvas;
		this.fontSize = 18;
		this.obj = new TextBlock("socket_status", "Disconnected");
		this.obj.left =  (this.canvasRef.width / 2) - gui.getContext().measureText(this.obj.text).width - 25;
		this.obj.top =  -1 * ((this.canvasRef.height) * 0.345);
		this.obj.fontSize = this.fontSize;
		this.obj.color = "red";
		this.obj.left =  (canvas.width / 2) - gui.getContext().measureText(this.obj.text).width - 25;
		this.obj.top =  -1 * ((canvas.height) * 0.345);
		gui.addControl(this.obj);
	}

	resize() {
		if (!this || !this.obj)
			return ;
		this.obj.top =  -1 * (this.canvasRef.height / 2 * 0.71) + this.fontSize / 2;

		this.obj.left = (this.canvasRef.width / 2) * 0.877;
	}

	set(connected: boolean) {
		if (!this || !this.obj)
			return ;
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