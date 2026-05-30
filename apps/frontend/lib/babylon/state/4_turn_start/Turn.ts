import { MeshBuilder, Scene, Mesh } from "@babylonjs/core"
import { Player } from "@/lib/babylon/player/Player";
import { IWeapon } from "../7_aiming/weapons/IWeapon";
import { Worm } from "@/lib/babylon/player/Worm";
import { createAimingTargetMesh } from "./aiming_meshes/createAimingTargetMesh";
import { createAimingMarker } from "./aiming_meshes/createAimingMarker";
import { createAimingPlane } from "./aiming_meshes/createAimingPlane";

const pi2 = Math.PI * 2;

/**
 * @param aimOriginX x origin point of projectile, in worldspace coords
 * @param aimOriginY y origin point of projectile, in worldspace coords
 * @param seperatedOrigin wether aimOrigin values should be used, 
 * or if weapons barrel point should be used to spawn a projectil at
 * @param aimAngle angle in degree, 0 = up, increasing = clockwise
 * @param aimForce amount of force a projectile will be moved at
 */
export interface aimingHelper {
	targetAngle: number;
	targetMarker: Mesh;
	targetDirection: Mesh;
	seperatedTarget: boolean;
	wormAngle: number;
	force: number;
	plane: Mesh;
}

export class Turn {
	public activePlayerId: string = "";
	public activePlayer: Player;
	public chosenWorm: Worm;
	public chosenWeapon: IWeapon | undefined = undefined;
	public aiming: aimingHelper;
	private notify: (msg: string) => void;
	constructor(
		player: Player, 
		scene: Scene,
		weapon: IWeapon | undefined,
		notify: (msg: string) => void,
	) {
		this.activePlayerId = player.id;
		this.activePlayer = player;
		this.chosenWorm = player.worms[0];
		this.chosenWeapon = weapon;
		this.aiming = {
			targetMarker: createAimingMarker(scene),
			plane: createAimingPlane(scene),
			targetDirection: createAimingTargetMesh(scene),
			seperatedTarget: false,
			targetAngle: 0,
			wormAngle: 0,
			force: 1,
		}
		this.notify = notify;
	}

	chooseWeapon(newWeapon: IWeapon | undefined) {
		// Hide old Weapon
		this.chosenWeapon?.show(false);

		// Set new Weapon
		this.chosenWeapon = newWeapon;
		if (this.chosenWeapon == undefined)
			return ;
		this.chosenWeapon.show(true);
		this.notify(`${this.chosenWorm.name} equips ${newWeapon?.name}`);

		// Set Position to player
		this.chosenWeapon.mesh.position.x = this.chosenWorm.mesh.position.x;
		this.chosenWeapon.mesh.position.y = this.chosenWorm.mesh.position.y;
	}

	/**
	 * Turns Weapon to new rotation
	 * @param angle new Rotation for Weapon in degrees
	 */
	turnWeapon() {
		if (!this.chosenWeapon) 
			return;
		// Babylon rotation is natively counter clockwise, but we would like cc, so we do 360° - x° to invert
		this.chosenWeapon.mesh.rotation.z = ((pi2 - this.aiming.wormAngle));
		if (this.aiming.targetDirection.visibility == 1)
			this.aiming.targetDirection.rotation.z = (pi2 - this.aiming.targetAngle);
	}

	dispose() {
		this.chosenWeapon?.dispose();
		this.aiming.targetMarker.dispose();
		this.aiming.plane.dispose();
		this.aiming.targetDirection.dispose();
	}

	end() {
		this.chosenWeapon?.show(false);
		this.aiming.seperatedTarget = false;
		this.aiming.wormAngle = 0;
		this.aiming.targetAngle = 0;
		this.aiming.force = 1;
		this.aiming.targetDirection.visibility = 0;
		this.aiming.targetMarker.visibility = 0;
	}
}