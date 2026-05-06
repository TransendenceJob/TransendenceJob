import { Scene, Mesh, Vector3, AbstractMesh } from '@babylonjs/core'
import { AimingAngle } from "./aiming/AimingAngle";
import { IAimType } from "./aiming/IAimType";
import { Explosion } from "./Explosion";
import { IWeapon } from "./IWeapon";

/**
 * Class that administrates specific Weapon
 */
export class AssaultRifle implements GenericGun {
	// Required for all weapons:
	public weaponId = 2;
	public name = "Assault Rifle";
	public allowedAngleMin = 0;
	public allowedAngleMax = 180;
	public projectileCount = 1;
	public speed = 2;
	public spread = 0;
	public damage = 10;
	public explosion: Explosion = {
		size: 0.2, 
		damage: 1, 
		affectTerrain: true
	};
	public span = (this.allowedAngleMax - this.allowedAngleMin + 360) % 360;
	public readonly meshes;
	public aimTypes: Array<IAimType>;

	constructor(scene: Scene, meshes: Array<AbstractMesh>) {
		this.meshes = meshes;
		// Needs to be called last, so weapon is properly initialised with relevant data
		this.aimTypes = [
			new AimingAngle(this.allowedAngleMin, this.allowedAngleMax, this.span),
		]
	}

	getPost() {
		return (this.meshes[0].position);
	}

	getRot() {
		return (this.meshes[0].rotation);
	}

	setPos(newPos: Vector3) {
		this.meshes.forEach((mesh) => {
			mesh.position = newPos.clone();
		})
	}

	setRot(rotation: Vector3) {
		this.meshes.forEach((mesh) => {
			mesh.rotation = rotation;
		})
	}

	setRotZ(angle: number) {
		this.meshes.forEach((mesh) => {
			mesh.rotation.z = angle;
		})
	}

	dispose() {
		this.meshes.forEach((mesh) => {
			mesh.dispose()
		})
	}
}
