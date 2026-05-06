import { AbstractMesh, Scene } from "@babylonjs/core"
import { AssaultRifle } from "./AssaultRifle"
import { IWeapon } from "./IWeapon"

/**
 * For each Entry, call the constructor by calling the stored construction function,
 * and giving it the specific fileName for that entry,
 * as well as the scene, which is required for the Weapon Constructor
 */
type Entry<T> = {
	instance: new (scene: Scene, meshes: Array<AbstractMesh>) => T,
	fileName: string,
}

/**
 * Stores all the weapons and their file paths.
 */
export const weaponList: Array<Entry<IWeapon>> = [
	{instance: AssaultRifle, fileName: "/models/AssaultRifle2_1.obj"},
]