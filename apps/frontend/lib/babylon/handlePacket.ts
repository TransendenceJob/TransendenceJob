import { SC_Type, SC_GenericPacket } from "@/shared/packets/ServerClientPackets"
import { StateMachine } from './state/StateMachine';
import { GameState } from '@/shared/state/GameState';
import { Nullable } from "@babylonjs/core";
import { Control, TextBlock } from "@babylonjs/gui";

export function handlePacket(data: SC_GenericPacket, state: StateMachine) {
	switch (data.type) {
		case SC_Type.SC_DEV_GameState : {
			const text: Nullable<Control> | undefined = state.guiHelper?.textGui.getControlByName("get_state");
			if (text) {
				(text as TextBlock).text = `Current State: ${data.gameState}`;
			}
			state.setState(data.gameState as GameState);
			break ;
		}
		case SC_Type.SC_GameData : {
			state.load(data.data)
			break ;
		}
		default : {
			console.log("BABYLON> Received unhandled type: ", data.type);
		}
	}
}