import { Vector3, AbstractMesh } from '@babylonjs/core'
import { IWeapon } from './IWeapon';
import { IAimType } from './aiming/IAimType';
import { Explosion } from './Explosion';

/**
 * Class that administrates specific Weapon
 */
export class GenericGun implements IWeapon{
	// Required for all weapons:
	public weaponId = 2;
	public name = "Assault Rifle";
	public allowedAngleMin = 0;
	public allowedAngleMax = 0;
	public projectileCount = 0;
	public speed = 0;
	public spread = 0;
	public damage = 0;
	public explosion: Explosion = {
		size: 0, 
		damage: 0, 
		affectTerrain: false
	};
	public span = 0;
	public aimTypes: Array<IAimType> = [];
	public readonly meshes: Array<AbstractMesh> = [];

	constructor() {
	}

	getPos() {
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
