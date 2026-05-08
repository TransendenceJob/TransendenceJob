import { AbstractMesh, ImportMeshAsync, Scene, MeshBuilder, Vector3, Mesh } from '@babylonjs/core';
// Might be able to be removed
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
			const parent: Mesh = MeshBuilder.CreateBox("unset weapon mesh", {}, scene);
			parent.visibility = 0;
			// Remove parenting, so meshes can later be put into one custom mesh
			meshes.forEach((mesh) => {
				mesh.parent = parent;
				mesh.visibility = 0;
			})
			// Offset in front of worm model, so gun is visible
			parent.position.z = -0.5;
			result.weapons.push(new entry.instance(parent, meshes));
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
