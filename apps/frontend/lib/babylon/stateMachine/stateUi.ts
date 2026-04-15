import { AdvancedDynamicTexture} from "@babylonjs/gui";

import type { msgToServerType } from '../../packets/msgToServerType';
import { setStateButtons } from "./setStateButtons";
import { setStateText } from "./setStateText";

export function stateUi(
	gui: AdvancedDynamicTexture,
	canvas: HTMLCanvasElement,
	msgToServer: msgToServerType,
) {
	setStateText(gui, canvas);
	setStateButtons(gui, canvas, msgToServer);
}
