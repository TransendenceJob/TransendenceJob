import { Scene, AbstractMesh } from '@babylonjs/core'
import { AimingAngle } from "../aiming/AimingAngle";
import { IAimType } from "../aiming/IAimType";
import { Explosion } from "../Explosion";
import { IWeapon } from "../IWeapon";
import { GenericWeapon } from '../GenericWeapon';

/**
 * Class that administrates specific Weapon
 */
export class AssaultRifle extends GenericWeapon implements IWeapon {
	public weaponId = 0;
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
	public readonly meshes: Array<AbstractMesh>;
	public aimTypes: Array<IAimType>;

	constructor(scene: Scene, meshes: Array<AbstractMesh>) {
		super();
		this.meshes = meshes;
		// Needs to be called last, so weapon is properly initialised with relevant data
		this.aimTypes = [
			new AimingAngle(this.allowedAngleMin, this.allowedAngleMax, this.span),
		]
	}
}
