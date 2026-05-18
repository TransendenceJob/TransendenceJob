import { StateMachine } from "../StateMachine";
import { gameData, playerData } from '@/shared/packets/util';
import { CS_FailedLoading, CS_FinishedLoading, CS_LoadingProgress, CS_Type } from '@/shared/packets/ClientServerPackets';
import { Ground } from "../../Ground";
import { Player } from "../../Player";
import { Worm } from "../../worms/Worm";
import { loadWeapons, loadingWeaponResult } from "./loadWeapons";

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
	machine.players.forEach(element => {
		element.dispose();
	});

	// Create new Players and Worms
	machine.players = new Array<Player>();
	data.players.forEach((player: playerData) => {
		machine.players.push(new Player(machine.scene, player));
	});
	loadingHelper.send("Players loaded");

	// Setup up interactions for worms
	machine.players.forEach((player) => {
		player.initPickWorm((chosen: Worm) => {
			if (machine.turn)
				machine.turn.chosenWorm = chosen;
		})
	});
	loadingHelper.send("Loaded Map");

	// Create Ground
	machine.ground = new Ground(machine.scene, data.map, false);
	loadingHelper.send("Initialised Worms");

	// Store turn order
	machine.turnOrder = data.turnOrder;
	loadingHelper.send("Turn Order loaded");

	const result: loadingWeaponResult = await loadWeapons(machine.scene);
	if (!result.success) {
		machine.msgToServer<CS_FailedLoading>(CS_Type.CS_FailedLoading, {
			msg: result.message,
		})
		return ;
	}
	machine.weapons = result.weapons;
	loadingHelper.send("Imported Weapon Meshes")

	// Finished
	machine.msgToServer<CS_FinishedLoading>(CS_Type.CS_FinishedLoading, {});
}