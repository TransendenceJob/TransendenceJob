import { AbstractMesh, Mesh } from '@babylonjs/core';
import { loaded, StateMachine } from '../StateMachine';
import { gameData, playerData } from '@/shared/packets/util';
import { CS_FailedLoading, CS_FinishedLoading, CS_LoadingProgress, CS_Type } from '@/shared/packets/ClientServerPackets';
import { Ground } from "./Ground";
import { Player } from "@/lib/babylon/player/Player";
import { Worm } from "@/lib/babylon/player/Worm";
import { loadWeapons, loadingWeaponResult } from "./loadWeapons";
import { Turn } from '../4_turn_start/Turn';
import { loadAimingMeshes } from './loadAimingMeshes';
import { ImportMesh } from './ImportMesh';

/**
 * Helper class, that offers the send function to send packages with an ever increasing percentage
 */
class LoadingHelper {
	private percentPerStep: number;
	private step: number;
	private sendPacket: (progress: number, msg: string) => void;

	// Mock constructor, actual constructor is start()
	constructor(stepCount: number, send: (progress: number, msg: string) => void) {
		if (stepCount == 0)
			this.percentPerStep = 0;
		else
			this.percentPerStep = (1 / stepCount) * 100;
		this.step = 1;
		this.sendPacket = send;
	}

	send(msg: string) {
		this.sendPacket(this.percentPerStep * this.step, msg);
		this.step++;
	}
}

export interface aimingMeshes {
	target: ImportMesh,
	direction: AbstractMesh,
	plane: Mesh,
}

/**
 * Called, when game starts loading
 * @param data Packet that contains info/data to load game
 */
export async function loadGame(machine: StateMachine, data: gameData) {
	console.log("BABYLON: Setting up Game according to given data");
	if (!data) return ;
	const LOADING_STEPS = 5;

	// Predefine how many times you will call the send() function to report progress
	const loadingHelper = new LoadingHelper(LOADING_STEPS, (progress: number, msg: string) => {
			machine.msgToServer<CS_LoadingProgress>(CS_Type.CS_LoadingProgress, {
				percentage: progress,
				msg: msg,
			});
		}
	);

	// Delete old Player&Worm Data
	machine.loaded?.players.forEach(element => {
		element.dispose();
	});


	// Load meshes for aiming stuffs
	const aiming: aimingMeshes = await loadAimingMeshes(machine.scene);
	loadingHelper.send("Imported Aiming Meshes")


	// Create new Players and Worms
	const players = new Array<Player>();
	data.players.forEach((player: playerData) => {
		players.push(new Player(machine.scene, player));
	});
	// Assume first player is active until otherwise specified
	if (players.length > 0)
		machine.activePlayerId = players[0].id;
	loadingHelper.send("Players loaded");

	
	// Create Ground
	const ground = new Ground(machine.scene, data.map, false);
	loadingHelper.send("Loaded Map");

	// Load Weapons & Meshes
	const result: loadingWeaponResult = await loadWeapons(
		machine,
		aiming);
	if (!result.success) {
		machine.msgToServer<CS_FailedLoading>(CS_Type.CS_FailedLoading, {
			msg: result.message,
		})
		return ;
	}
	const weapons = result.weapons;
	loadingHelper.send("Imported Weapon Meshes")

	const turn = new Turn(machine, players[0], undefined, aiming);
	loadingHelper.send(`Chose Player ${players[0].name} as first player`);

	// Finished
	machine.loaded = {
		ground,
		weapons,
		players,
		turn,
		aiming,
	}
	machine.msgToServer<CS_FinishedLoading>(CS_Type.CS_FinishedLoading, {});
}