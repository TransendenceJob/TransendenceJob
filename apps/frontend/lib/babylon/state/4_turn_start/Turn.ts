import { MeshBuilder, Scene, Mesh, AbstractMesh } from "@babylonjs/core"
import { Player } from "@/lib/babylon/player/Player";
import { IWeapon } from "../7_aiming/weapons/IWeapon";
import { Worm } from "@/lib/babylon/player/Worm";
import { StateMachine } from "../StateMachine";
import { ImportMesh } from "../1_loading/ImportMesh";
import { aimingMeshes } from "../1_loading/loadGame";
import { DotTail } from "../1_loading/DotTail";

const pi2 = Math.PI * 2;

/**
 * @param aimOriginX x origin point of projectile, in worldspace coords
 * @param aimOriginY y origin point of projectile, in worldspace coords
 * @param seperatedOrigin wether aimOrigin values should be used, 
 * or if weapons barrel point should be used to spawn a projectil at
 * @param aimAngle angle in degree, 0 = up, increasing = clockwise
 * @param aimForce amount of force a projectile will be moved at
 */
export interface aimingHelper extends aimingMeshes {
	target: ImportMesh;
	direction: AbstractMesh;
	plane: Mesh;
	tail: DotTail;
	targetAngle: number;
	seperatedTarget: boolean;
	wormAngle: number;
	force: number;
}

export class Turn {
	public activePlayerId: string = "";
	public activePlayer: Player;
	public chosenWorm: Worm;
	public chosenWeapon: IWeapon | undefined = undefined;
	public aiming: aimingHelper;
	private notify: (msg: string) => void;
	public cancelAiming: boolean = false;
	constructor(
		state: StateMachine,
		player: Player,
		weapon: IWeapon | undefined,
		aimingMeshes: aimingMeshes,
	) {
		this.activePlayerId = player.id;
		this.activePlayer = player;
		this.chosenWorm = player.worms[0];
		this.chosenWeapon = weapon;
		this.aiming = { 
			...aimingMeshes,
			seperatedTarget: false,
			targetAngle: 0,
			wormAngle: 0,
			force: 1,
		}
		this.notify = (msg: string) => {state.guiHelper?.notifications.add(msg)};
	}

	chooseWeapon(newWeapon: IWeapon | undefined) {
		// Hide old Weapon
		this.chosenWeapon?.show(false);

		// Set new Weapon
		this.chosenWeapon = newWeapon;
		if (this.chosenWeapon == undefined)
			return ;
		this.turnWeapon(this.chosenWeapon.getStartWormAngle());
		this.chosenWeapon.show(true);
		this.notify(`${this.chosenWorm.name} equips ${newWeapon?.name}`);

		// Set Position to player
		this.chosenWeapon.mesh.position.x = this.chosenWorm.collider.position.x;
		this.chosenWeapon.mesh.position.y = this.chosenWorm.collider.position.y;
	}

	turnWeapon(angle: number) {
		if (!this.chosenWeapon) 
			return;
		this.aiming.wormAngle = angle;
		if (this.chosenWeapon)
			this.chosenWeapon.mesh.rotation.z = (Math.PI * 2 - angle) % (Math.PI * 2);
	}

	turnDirection(angle: number) {
		this.aiming.direction.rotation.z = (Math.PI * 2 - angle) % (Math.PI * 2);
	}

	dispose() {
		console.log("Disposing ", this.chosenWeapon);
		// Are you sure this is right? Turn only tracks stuff, which is created elsewhere so far
		this.chosenWeapon?.dispose();
	}

	end() {
		this.chosenWeapon?.show(false);
		this.aiming.seperatedTarget = false;
		this.aiming.wormAngle = 0;
		this.aiming.targetAngle = 0;
		this.aiming.force = 1;
		this.aiming.target.show(false);
		this.aiming.direction.setEnabled(false);
		this.aiming.tail.deactivate();
	}
}