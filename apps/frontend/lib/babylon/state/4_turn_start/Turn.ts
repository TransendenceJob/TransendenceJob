import { MeshBuilder, Scene, Mesh } from "@babylonjs/core"
import { Player } from "@/lib/babylon/player/Player";
import { IWeapon } from "../7_aiming/weapons/IWeapon";
import { Worm } from "@/lib/babylon/player/Worm";
import { createAimingTargetMesh } from "./createAimingTargetMesh";

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


function createAimingMarkerMesh(scene: Scene) {
	const mesh = MeshBuilder.CreateSphere("Aiming Pick Position Marker", {segments: 2}, scene);
	mesh.visibility = 0;
	return (mesh);
}

function createAimingPlaneMesh(scene: Scene) {
	const mesh = MeshBuilder.CreatePlane("Aiming Pick Position Plane", {size: 200}, scene);
	mesh.setEnabled(false);
	return (mesh);
}

export class Turn {
	public activePlayerId: string = "";
	public activePlayer: Player;
	public chosenWorm: Worm;
	public chosenWeapon: IWeapon | undefined = undefined;
	public aiming: aimingHelper;
	constructor(player: Player, scene: Scene) {
		this.activePlayerId = player.id;
		this.activePlayer = player;
		this.chosenWorm = player.worms[0];
		this.aiming = {
			targetMarker: createAimingMarkerMesh(scene),
			plane: createAimingPlaneMesh(scene),
			targetDirection: createAimingTargetMesh(scene),
			seperatedTarget: false,
			targetAngle: 0,
			wormAngle: 0,
			force: 1,
		}
	}

	chooseWeapon(newWeapon: IWeapon | undefined) {
		this.chosenWeapon = newWeapon;
		if (this.chosenWeapon == undefined)
			return ;
		this.chosenWeapon.show(true);
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
		console.log("Rotation: ", this.aiming.wormAngle);
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