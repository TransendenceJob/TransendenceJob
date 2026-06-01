import { SC_Type, SC_GenericPacket, frontendServerPackets } from "@/shared/packets/ServerClientPackets"
import { StateMachine } from '../babylon/state/StateMachine';
import { GameState } from '@/shared/state/GameState';
import { Nullable } from "@babylonjs/core";
import { Control, TextBlock } from "@babylonjs/gui";
import { Player } from "../babylon/player/Player";
import { Worm } from '../babylon/player/Worm';
import { aimStateId } from "@/shared/packets/util";

function findWormById(players: Array<Player>, wormId: number): Worm | undefined {
	let worm: Worm | undefined = undefined;
	for (const player of players) {
		worm = player.worms.find((worm) => worm.id == wormId);
		if (worm != undefined) return worm;
	}
	return (undefined)
}

export function handlePacket(data: SC_GenericPacket, state: StateMachine) {
	// Ignore Frontend Packets
	if (frontendServerPackets.find((type: SC_Type) => (type == data.type)))
		return ;
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
		// Turn Worms Weapon
		case SC_Type.SC_AimAngle : {
			if (!state.loaded)
				return ;
			state.loaded.turn.turnWeapon(data.angle);
			break ;
		}
		// Turn Target Direction Markers Angle
		case SC_Type.SC_AimTargetAngle : {
			if (!state.loaded)
				return ;
			state.loaded.turn.turnDirection(data.angle);
			break ;
		}
		case SC_Type.SC_AimMoveTarget : {
			if (!state.loaded)
				return ;
			state.loaded.aiming.target.mesh.position.x = data.point.x;
			state.loaded.aiming.target.mesh.position.y = data.point.y;
			break ;
		}
		case SC_Type.SC_SwitchAimState : {
			if (!state.loaded)
				return ;
			const aim = state.loaded.turn.aiming;
			if (data.entering == true) {
				if (data.stateId == aimStateId.PianoPickPosition) {
					aim.targetMarker.show(true);
				}
				else if (data.stateId == aimStateId.PickPosition) {
					aim.targetMarker.show(true);
				}
				else if (data.stateId == aimStateId.SwitchTargetAngle) {
					aim.targetMarker.show(true);
					aim.targetDirection.setEnabled(true);
					aim.targetDirection.position.copyFrom(aim.targetMarker.mesh.position);
				}
			}
			else {
				aim.targetMarker.show(false);
				aim.targetDirection.setEnabled(false);
			}
			break ;
		}
		case SC_Type.SC_ExplosionOccurs: {
			console.log("Handling Explosion");
			if (state.state != GameState.TURN_END)
				break ;
			state.loaded?.ground?.affectTerrain(data.point.x, data.point.y, data.radius);
			break ;
		}
		default : {
			console.log("BABYLON> Received unhandled type: ", data.type);
		}
	}
}