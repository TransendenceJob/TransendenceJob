// @ts-ignore
import { Mesh } from '@babylonjs/core';
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
	dispose(): void;
}