import { AbstractMesh, Mesh } from '@babylonjs/core'

/**
 * Class that lets specific weapons inherit general functions each weapon should have
 */
export abstract class GenericWeapon {
	// The ! is "definite assignment assertion", which says that this property will be initialised properly,
	// just not here, because it should be initialised in the class inheriting this
	public mesh!: Mesh;
	public childMeshes: Array<AbstractMesh> = [];
	
	show(result: boolean) {
		this.childMeshes.forEach((mesh) => {
			mesh.visibility = result ? 1 : 0;
		})
	}

	dispose() {
		this.mesh.dispose();
		this.childMeshes.forEach((mesh) => {
			mesh.dispose()
		})
	}
}
