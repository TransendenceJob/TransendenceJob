// @ts-ignore
import { AdvancedDynamicTexture, Button} from "@babylonjs/gui";

import { setButtonSize, setButtonPos } from '../util/guiUtil';
import { msgToServerType } from "@/lib/packets/msgToServerType";
import { CS_Type, CS_DEV_SetGameState } from "../../../shared/packets/ClientServerPackets";

export function setStateButtons(
	gui: AdvancedDynamicTexture, 
	canvas: HTMLCanvasElement, 
	msgToServer: msgToServerType
) {
	const scale = 0.05;
    const heightOffset = scale;
    for (let i = 1; i < 10; i++) {
        const button = Button.CreateSimpleButton("receive", `${10 - i - 1}`);
        setButtonSize(button, canvas, scale / 2, scale / 2);
        const d_x = 1 - scale * (i % 3.00001);
        const d_y = -1 + heightOffset + scale * (1 + (Math.floor((9 - i) / 3)));
        setButtonPos(button, canvas, d_x, d_y);
        button.color = "#63a6d0";
        button.onPointerUpObservable.add(() => {
		    msgToServer<CS_DEV_SetGameState>(CS_Type.CS_DEV_SetGameState, {state: 10 - i - 1});
			console.log(`Pressed button ${i}`)
        })
        gui.addControl(button);
    }
}