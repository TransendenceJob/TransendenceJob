import { AdvancedDynamicTexture} from "@babylonjs/gui";

import type { msgToServerType } from '../../packets/msgToServerType';
import { setStateButtons } from "./setStateButtons";
import { setStateText } from "./setStateText";

export function stateUi(
	textGui: AdvancedDynamicTexture,
	buttonGui: AdvancedDynamicTexture,
	canvas: HTMLCanvasElement,
	msgToServer: msgToServerType,
) : () => void {
	const resizeFunctions: Array<() => void> = [];
	setStateText(textGui, canvas, resizeFunctions);
	setStateButtons(buttonGui, canvas, msgToServer, resizeFunctions);
	const resize = () => {
		resizeFunctions.forEach((func) => {
			func()
		})
	}
	return (resize);
}
