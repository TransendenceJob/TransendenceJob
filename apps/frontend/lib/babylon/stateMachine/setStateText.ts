// @ts-ignore
import { AdvancedDynamicTexture, TextBlock} from "@babylonjs/gui";

export function setStateText(gui: AdvancedDynamicTexture, canvas: HTMLCanvasElement) {
	const socket_status = new TextBlock("set_state", "Set Gamestate");
    socket_status.underline = true;
	socket_status.fontSize = 18;
	socket_status.color = "#63a6d0";
	socket_status.top =  -1 * (canvas.height / 2 * 0.925);
    socket_status.left = (canvas.width / 2) * 0.877;
	gui.addControl(socket_status);
}