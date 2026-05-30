import { Mesh, AbstractMesh, Vector3 } from '@babylonjs/core'
import { AimingAngle } from "../aiming/AimingAngle";
import { IAimType } from "../aiming/IAimType";
import { Explosion } from "../Explosion";
import { IWeapon } from "../IWeapon";
import { GenericWeapon } from '../GenericWeapon';
import { PickPosition } from '../aiming/PickPosition';
import { SwitchTargetAngle } from '../aiming/SwitchTargetAngle';
import { aimingHelper } from '../../../4_turn_start/Turn';
import { aimingMeshes } from '../../../1_loading/loadGame';

const SCALE = 0.01;
// Mutiply degrees with this to convert to radians
const degToRad = Math.PI / 180;

/**
 * Class that administrates specific Weapon
 */
export class AirStrike extends GenericWeapon implements IWeapon {
	public weaponId = 1;
	public name = "Air Strike";
	private allowedAngleMin = 135 * degToRad;
	private allowedAngleMax = 225 * degToRad;
	private startAngle = 135 * degToRad;
	public projectileCount = 3;
	private snapAngle = 90 * degToRad;
	public speed = 1;
	public spread = 0.2;
	public damage = 3;
	public explosion: Explosion = {
		size: 0.2,
		damage: 5,
		affectTerrain: true
	};
	public mesh: Mesh;
	public readonly childMeshes: Array<AbstractMesh>
	public aimTypes: Array<IAimType>;

	constructor(mesh: Mesh, childMeshes: Array<AbstractMesh>, aimMeshes: aimingMeshes) {
		super();
		this.mesh = mesh;
		this.childMeshes = childMeshes;
		this.childMeshes.forEach((mesh) => {
			mesh.scaling = new Vector3(SCALE, SCALE, SCALE);
			mesh.rotation.y = Math.PI / 2;
			mesh.rotation.x = Math.PI / 6;
		})
		// Needs to be called last, so weapon is properly initialised with relevant data
		this.aimTypes = [
			new PickPosition(aimMeshes),
			new SwitchTargetAngle({
				snapAngle: this.snapAngle,
				minAngle: this.allowedAngleMin,
				maxAngle: this.allowedAngleMax,
				startAngle: this.startAngle,
			}, aimMeshes),
		]
	}

	/**
	 * Dont use this one
	 * 
	 * This function only exists anymore, 
	 * because the Weapons are created on load time, 
	 * when no Turn exists, so they cannot get access to all the marker objects,
	 * which are stored in the turn
	 * Currently, we are using the Turn to host the aiming data,
	 * which isnt ideal, as it should be done in the weapon.
	 * But since on State Machine creation, we dont have a turn,
	 * we cannot.
	 * Idea: Assign Turn in State Machine Constructor with a mock player until loading happens
	 */
	getProjectileSpawnPos(): Vector3 {
		return (Vector3.Zero())
	}
}
