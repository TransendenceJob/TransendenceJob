// @ts-ignore
import { AdvancedDynamicTexture } from '@babylonjs/gui'
// @ts-ignore
import { SC_Type, SC_GenericPacket } from "../../shared/packets/ServerClientPackets"
import { StateMachine } from './state/StateMachine';

export function handlePacket(data: SC_GenericPacket, textGui: AdvancedDynamicTexture, state: StateMachine) {
	switch (data.type) {
		case SC_Type.SC_DEV_GameState : {
			const text = textGui.getControlByName("get_state");
			if (!text) {
				console.warn("Babylon Error: Cannot find element to display game state");
				return ;
			}
			text.text = `Current State: ${data.gameState}`;
			state.setState(data.gameState);
		}
	}
}