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
			state.load(data.data);
			break ;
		}
		case SC_Type.SC_ActivePlayerChanged : {
			state.activePlayerId = data.activeId;
			break ;
		}
		case SC_Type.SC_WormChosen : {
			if (!state.loaded)
				return ;
			const target = findWormById(state.loaded.players, data.wormId);
			if (state.loaded.turn && target != undefined)
				state.loaded.turn.chosenWorm = target;
			break ;
		}
		case SC_Type.SC_WeaponChosen : {
			if (!state.loaded)
				return ;
			state.loaded.turn.chooseWeapon(
				state.loaded.weapons.find(
					(weapon) => (weapon.weaponId == data.id)
				)
			);
			break ;
		}
		case SC_Type.SC_ExplosionOccurs: {
			console.log("Handling Explosion");
			if (state.state != GameState.TURN_END)
				break ;
			state.loaded?.ground?.affectTerrain(data.point.x, data.point.y, data.radius);
		}
		default : {
			console.log("BABYLON> Received unhandled type: ", data.type);
		}
	}
}