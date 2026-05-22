import { Vector2 } from "@babylonjs/core"
import { Player } from "@/lib/babylon/player/Player";
import { IWeapon } from "../7_aiming/weapons/IWeapon";
import { Worm } from "@/lib/babylon/player/Worm";


export class Turn {
	public activePlayerId: string = "";
	public activePlayer: Player;
	public chosenWorm: Worm;
	public chosenWeapon: IWeapon | undefined = undefined;
	public aimOrigin: Vector2 | undefined = undefined;
	public aimAngle: number = 0;
	public aimForce: number = 1;
	constructor(player: Player) {
		this.activePlayerId = player.id;
		this.activePlayer = player;
		this.chosenWorm = player.worms[0];
	}

	/**
	 * Turns Weapon to new rotation
	 * @param angle new Rotation for Weapon in degrees
	 */
	turnWeapon(angle: number | undefined) {
		if (angle == undefined || !this.chosenWeapon) 
			return;

		this.chosenWeapon.mesh.rotation.z = (((360 - angle) / 180 * Math.PI));
	}

	dispose() {
		this.chosenWeapon?.dispose();
	}

}