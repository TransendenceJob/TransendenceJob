import { SC_Type, SC_GenericPacket } from "@/shared/packets/ServerClientPackets"
import { StateMachine } from '../babylon/state/StateMachine';
import { GameState } from '@/shared/state/GameState';
import { Nullable } from "@babylonjs/core";
import { Control, TextBlock } from "@babylonjs/gui";
import { Player } from "../babylon/player/Player";
import { Worm } from '../babylon/player/Worm';

function findWormById(players: Array<Player>, wormId: number): Worm | undefined {
	let worm: Worm | undefined = undefined;
	for (const player of players) {
		worm = player.worms.find((worm) => worm.id == wormId);
		if (worm != undefined) return worm;
	}
	return (undefined)
}

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
		case SC_Type.SC_ActivePlayerChanged : {
			state.activePlayerId = data.activeId;
			break ;
		}
		case SC_Type.SC_WormChosen : {
			console.log(`Trying to find worm ${data.wormId}`);
			const target = findWormById(state.players, data.wormId);
			if (state.turn && target != undefined)
				state.turn.chosenWorm = target;
			console.log(`Found worm: `, state.turn?.chosenWorm, target);
			break ;
		}
		case SC_Type.SC_ExplosionOccurs: {
			console.log("Handling Explosion");
			if (state.state != GameState.TURN_END)
				break ;
			state.ground?.affectTerrain(data.point.x, data.point.y, data.radius);
		}
		default : {
			console.log("BABYLON> Received unhandled type: ", data.type);
		}
	}
}