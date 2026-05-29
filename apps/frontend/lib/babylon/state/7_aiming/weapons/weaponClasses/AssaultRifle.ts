import { Mesh, AbstractMesh, Vector3 } from '@babylonjs/core'
import { AimingAngle } from "../aiming/AimingAngle";
import { IAimType } from "../aiming/IAimType";
import { Explosion } from "../Explosion";
import { IWeapon } from "../IWeapon";
import { GenericWeapon } from '../GenericWeapon';
import { PickPosition } from '../aiming/PickTargetPosition';
import { SwitchTargetAngle } from '../aiming/SwitchTargetAngle';

const SCALE = 0.2;
// Mutiply degrees with this to convert to radians
const degToRad = Math.PI / 180;

/**
 * Class that administrates specific Weapon
 * @note all angles in radians
 */
export class AssaultRifle extends GenericWeapon implements IWeapon {
	public weaponId = 0;
	public name = "Assault Rifle";
	public allowedAngleMin = 0;
	public allowedAngleMax = 180 * degToRad;
	public projectileCount = 1;
	public turnSpeed = 3 * degToRad;
	public speed = 0.95;
	public spread = 0;
	public damage = 10;
	public explosion: Explosion = {
		size: 0.2,
		damage: 1, 
		affectTerrain: true
	};
	public mesh: Mesh;
	public readonly childMeshes: Array<AbstractMesh>
	public aimTypes: Array<IAimType>;
	private nozzleVector: Vector3;

	constructor(mesh: Mesh, childMeshes: Array<AbstractMesh>) {
		super();
		this.mesh = mesh;
		this.childMeshes = childMeshes;
		this.childMeshes.forEach((mesh) => {
			mesh.scaling = new Vector3(SCALE, SCALE, SCALE);
		})
		// Needs to be called last, so weapon is properly initialised with relevant data
		this.aimTypes = [
			new AimingAngle({
				minAngle: this.allowedAngleMin, 
				maxAngle: this.allowedAngleMax, 
				turnSpeed: this.turnSpeed
			}),
		]
		// This should be calculated in Blender (need to double values from there)
		// It points to the tip of the nozzle, and is needed to spawn projectiles
		this.nozzleVector = new Vector3(-3.61 * SCALE, 0.64 * SCALE, 0);
	}

	getProjectileSpawnPos() {
		const angle = this.mesh.rotation.z;
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		const localX = this.nozzleVector.x * cos - this.nozzleVector.y * sin;
		const localY = this.nozzleVector.x * sin + this.nozzleVector.y * cos;
		return new Vector3(
			localX + this.mesh.position.x,
			localY + this.mesh.position.y,
			this.mesh.position.z
		);
	}
}
