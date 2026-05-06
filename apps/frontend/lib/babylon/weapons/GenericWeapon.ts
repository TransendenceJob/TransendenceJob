import { Vector3, AbstractMesh } from '@babylonjs/core'

/**
 * Class that lets specific weapons inherit general functions each weapon should have
 */
export class GenericWeapon {
	public meshes: Array<AbstractMesh> = [];

	constructor() {}

	getPos() {
		return (this.meshes[0].position);
	}

	getRot() {
		return (this.meshes[0].rotation);
	}

	setPos(newPos: Vector3) {
		this.meshes.forEach((mesh) => {
			mesh.position = newPos.clone();
		})
	}

	setRot(rotation: Vector3) {
		this.meshes.forEach((mesh) => {
			mesh.rotation = rotation;
		})
	}

	setRotZ(angle: number) {
		this.meshes.forEach((mesh) => {
			mesh.rotation.z = angle;
		})
	}

	dispose() {
		this.meshes.forEach((mesh) => {
			mesh.dispose()
		})
	}
}
