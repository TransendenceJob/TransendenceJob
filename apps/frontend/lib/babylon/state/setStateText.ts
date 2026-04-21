// @ts-ignore
import { AdvancedDynamicTexture, TextBlock} from "@babylonjs/gui";

export function setStateText(gui: AdvancedDynamicTexture, canvas: HTMLCanvasElement) {
	const fontSize = 18;

	const set_state = new TextBlock("set_state", "Set Gamestate");
    set_state.underline = true;
	set_state.fontSize = fontSize;
	set_state.color = "#63a6d0";
	set_state.top =  -1 * (canvas.height / 2 * 0.925);
    set_state.left = (canvas.width / 2) * 0.877;
	gui.addControl(set_state);
	
	const get_state = new TextBlock("get_state", "Current State:  ");
	get_state.fontSize = fontSize;
	get_state.color = "#63a6d0";
	get_state.top =  -1 * (canvas.height / 2 * 0.71) - fontSize / 2;
    get_state.left = (canvas.width / 2) * 0.877;
	gui.addControl(get_state);
}