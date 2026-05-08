import { AbstractMesh, Mesh } from '@babylonjs/core'

/**
 * Class that lets specific weapons inherit general functions each weapon should have
 */
export class GenericWeapon {
	public mesh: Mesh;
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
