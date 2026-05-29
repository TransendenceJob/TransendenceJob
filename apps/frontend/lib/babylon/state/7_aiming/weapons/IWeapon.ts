import { AbstractMesh, Mesh, Vector3 } from '@babylonjs/core';
import { IAimType } from "./aiming/IAimType";
import { Explosion } from "./Explosion";

/**
 * Interface that defines the minimum properties a Weapon must have
 * @note All angles on weapons and aiming are in radians
 * 
 * @param weaponId Identifier for the weapon
 * @param name Name to display for this weapon
 * @param aimTypes Array of Control Schemes to be executed in order
 * @param projectileCount Amount of projectiles this weapon will shoot out
 * @param speed The velocity with which a projectile spawns (unit TBD)
 * @param spread How inaccurate this weapon is 
 * 		1 = no deviation, 
 * 		0.5 = final angle chosen based on 180 degree wide window centered on intial 
 * 		0 = final angle is completely random, may go up to 
 * @param damage How much damage the projectile of this weapon does on contact with another worm
 * @param explosion a potential explosion that will be executed on the projectile hitting something
 * @param mesh the mesh for the weapon (parent Mesh)
 * @param childMeshes subMeshes for this weapon, bound to the parent Mesh
 * 
 * @function show displays the weapons child Meshes
 * @function getProjectileSpawnPos Returns vector to the point projectiles spawn at
 * @function dispose Cleans up the meshes associated with this weapon
 */
export interface IWeapon {
	weaponId: number;
	name: string;
	aimTypes: Array<IAimType>;
	projectileCount: number;
	spread: number;
	damage: number;
	explosion: Explosion | undefined;
	mesh: Mesh;
	childMeshes: Array<AbstractMesh>;

	/**
	 * Change visibility of weapon
	 */
	show(status: boolean): void;

	/**
	 * May sometimes return 0,0,0 when its result isnt to be used
	 */
	getProjectileSpawnPos(): Vector3;

	/**
	 * Used to clean up memory of the weapon,
	 * disposes assigned meshes
	 */
	dispose(): void;
}

/**
 * Spread / Accuracy
 * The amount of deviation a projectile may get between the chosen angle, 
 * and the final angle that the projectile travels.
 * 
 * Extended formula with degrees:
 * const random = (Math.random() - 0.5) * 2 
 * const deviation = spread * 180
 * const raw_angle = angle + random * (deviation)
 * const final_angle = (raw_angle + 360) % 360
 * 
 * Simplified formula with radians:
 * final_angle = ((angle + ((Math.random() - 0.5) * 2) * spread * Math.PI) + (Math.PI * 2)) % (Math.PI * 2)
 * 
 * This produces a new angle that the projectile will actually use
 * Because the entire term is multiplied by spread, this means 0 spread means no deviation
 * If the spread is not 0, it will create a range of angles, between which the final projectile will randomly be chosen,
 * the center of which is placed at the original angle.
 * 
 * spread	final angle
 * 0		x
 * 0.25		x +/- 45°
 * 0.5		x +/- 90°
 * 0.75		x +/- 135°
 * 1		x +/- 180° or in other words: Between 0° and 360°
 */