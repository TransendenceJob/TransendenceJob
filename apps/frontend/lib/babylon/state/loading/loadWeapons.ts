import { AbstractMesh, ImportMeshAsync, Scene } from '@babylonjs/core';
import "@babylonjs/loaders/OBJ";
import { weaponList } from '../../weapons/weaponList';
import { IWeapon } from '../../weapons/IWeapon';

async function load(scene: Scene, file: string): Promise<Array<AbstractMesh>> {
	// May throw exception, should be caught on specific Weapon Creation that calls this in constructor
	const result = await ImportMeshAsync(
		file,
		scene
	);
	// We are blindly trusting that developers handle materials from mtl files correctly
	return result.meshes;
}

export interface loadingWeaponResult {
	weapons: Array<IWeapon>,
	success: boolean,
	message: string,
}

export async function loadWeapons(scene: Scene) {
	const result: loadingWeaponResult = {
		weapons: [],
		success: false,
		message: ""
	}

	// Try to load each Weapon, stopping on failure
	for (const entry of weaponList) {
		try {
			const meshes = await load(scene, entry.fileName);
			result.weapons.push(new entry.instance(scene, meshes));
		}
		catch (e) {
			result.message = `BABYLON: Error while trying to load weapon ${entry.fileName}`;
			console.warn(result.message);
			return (result);
		}
	}
	result.success = true;
	return (result);
}
