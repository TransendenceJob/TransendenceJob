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
	meshes: Array<AbstractMesh>;

	/**
	 * Returns Rotation of first mesh of Weapon
	 */
	getPos(): Vector3;

	/**
	 * Returns Rotation of first mesh of Weapon
	 */
	getRot(): Vector3;

	/**
	 * Used to move the specific Weapon to the given coordinates
	 * Use this instead of manipulating meshes, because this applies to all meshes
	 * @param newPos Vector for position
	 */
	setPos(newPos: Vector3): void;

	/**
	 * Used to rotate the specific Weapon to the given angles
	 * Use this instead of manipulating meshes, because this applies to all meshes
	 * @param rotation Vector of rotations on each axis 
	 */
	setRot(rotation: Vector3): void;

	/**
	 * Use this to to rotate Weapon specifically on Z axis
	 * @param angle 
	 */
	setRotZ(angle: number): void

	/**
	 * Used to clean up memory of the weapon,
	 * disposes assigned meshes
	 */
	dispose(): void;
}