import { Scene, MeshBuilder, Mesh, AbstractMesh, Color3, StandardMaterial, ImportMeshAsync, ISceneLoaderAsyncResult } from '@babylonjs/core';

/**
 * Uses the ImportMesh Helper class to handle creation of a mesh asynchronously.
 * This function is async, and must therefore be awaited
 * @warning will throw Error if file could not be located
 * @param scene Scene to place meshes in
 * @param name What to name the new mesh and child meshes
 * @param path Html file path to get file from nginx container (should start with /assets/)
 * @returns Promise for created mesh
 * 
 */
export async function importMesh(scene: Scene, name: string, path: string):  Promise<ImportMesh> {
	const imported: ISceneLoaderAsyncResult = await ImportMeshAsync(
		path,
		scene
	);
	const result = new ImportMesh(scene, name, imported.meshes);
	return (result);
}

export class ImportMesh {
	public mesh: AbstractMesh;
	public all: Array<AbstractMesh>;
	constructor(scene: Scene, name: string, meshes: Array<AbstractMesh> ) {
		this.mesh = meshes[0];
		this.mesh.name = name;
		let i = 0;
		meshes.forEach((mesh) => {
			mesh.setEnabled(false);
			if (mesh === meshes[0])
				return ;
			mesh.name = name + ` child ${i}`;
			mesh.parent = this.mesh;
			i++;
		})
		this.all = meshes;
	}

	// Changes visibitliy
	show(yes: boolean) {
		this.all.forEach((mesh) => {
			mesh.setEnabled(yes);
		})
	}

	dispose() {
		this.all.forEach((mesh) => {
			mesh.dispose();
		})
	}
}
