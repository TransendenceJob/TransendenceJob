import { AdvancedDynamicTexture} from "@babylonjs/gui";

import type { msgToServerType } from '../../packets/msgToServerType';
import { setStateButtons } from "./setStateButtons";
import { setStateText } from "./setStateText";

export function stateUi(
	textGui: AdvancedDynamicTexture,
	buttonGui: AdvancedDynamicTexture,
	canvas: HTMLCanvasElement,
	msgToServer: msgToServerType,
) {
	setStateText(textGui, canvas);
	setStateButtons(buttonGui, canvas, msgToServer);
}
