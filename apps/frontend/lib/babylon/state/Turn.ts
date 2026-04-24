// @ts-ignore
import { Vector2 } from "@babylonjs/core"
import { Player } from "../Player";
import { IWeapon } from "../weapons/IWeapon";
import { Worm } from "../worms/Worm";


export class Turn {
	private activePlayerId: number = -1;
	private activePlayer: Player;
	public chosenWorm: Worm | undefined = undefined;
	public chosenWeapon: IWeapon | undefined = undefined;
	public aimOrigin: Vector2 = new Vector2(0, 0);
	public aimAngle: number = 0;
	public aimForce: number = 1;
	constructor(player: Player) {
		this.activePlayerId = player.id;
		this.activePlayer = player;
	}

	/**
	 * Turns Weapon to new rotation
	 * @param angle new Rotation for Weapon in degrees
	 */
	turnWeapon(angle: number | undefined) {
		if (!angle || !this.chosenWeapon) 
			return;
		this.chosenWeapon.mesh.rotation.z = ((360 - angle) / 180 * Math.PI);
	}

	dispose() {
		this.chosenWorm?.dispose();
		this.chosenWeapon?.dispose();
	}

}