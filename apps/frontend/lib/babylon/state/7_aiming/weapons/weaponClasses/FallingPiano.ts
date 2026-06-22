import { Mesh, AbstractMesh, Vector3 } from '@babylonjs/core'
import { IAimType } from "../aiming/IAimType";
import { Explosion } from "../Explosion";
import { IWeapon } from "../IWeapon";
import { GenericWeapon } from '../GenericWeapon';
import { PianoPickPosition } from '../aiming/PianoPickPosition';
import { weaponHelper } from '../../../1_loading/loadGame';
import { weaponIds } from '@/shared/weapons/weaponIds';
import { msgToServerType } from '@/lib/packets/msgToServerType';
import { StateMachine } from '../../../StateMachine';

const SCALE = 0.01;

/**
 * Class that administrates specific Weapon
 */
export class FallingPiano extends GenericWeapon implements IWeapon {
	public name = "Falling Piano";
	public weaponId: number;
	public projectileCount = 1;
	public speed = 5;
	public spread = 0;
	public damage = 25;
	public explosion: Explosion = {
		size: 3,
		damage: 50,
		affectTerrain: true
	};
	public mesh: Mesh;
	public readonly childMeshes: Array<AbstractMesh>
	public aimTypes: Array<IAimType>;

	constructor(
		mesh: Mesh, 
		childMeshes: Array<AbstractMesh>, 
		weaponHelper: weaponHelper, 
		state: StateMachine
	) {
		super();
		this.weaponId = weaponIds.get(this.name);
		this.mesh = mesh;
		this.childMeshes = childMeshes;
		this.childMeshes.forEach((mesh) => {
			mesh.scaling = new Vector3(SCALE, SCALE, SCALE);
			mesh.rotation.y = Math.PI / 2;
			mesh.rotation.x = Math.PI / 6;
		})
		// Needs to be called last, so weapon is properly initialised with relevant data
		this.aimTypes = [
			new PianoPickPosition(weaponHelper, state.msgToServer)
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


	getStartWormAngle(): number {
		return (0)
	}
}
