import { AbstractMesh, Mesh, Vector3 } from '@babylonjs/core';
import { IAimType } from "./aiming/IAimType";
import { Explosion } from "./Explosion";

export interface IWeapon {
	weaponId: number;
	name: string;
	aimTypes: Array<IAimType>;
	allowedAngleMin: number;
	allowedAngleMax: number;
	projectileCount: number;
	speed: number;
	spread: number;
	damage: number;
	explosion: Explosion;
	mesh: Mesh;
	childMeshes: Array<AbstractMesh>;

	/**
	 * Change visibility of weapon
	 */
	show(status: boolean): void;

	getProjectileSpawnPos(): Vector3;

	/**
	 * Used to clean up memory of the weapon,
	 * disposes assigned meshes
	 */
	dispose(): void;
}