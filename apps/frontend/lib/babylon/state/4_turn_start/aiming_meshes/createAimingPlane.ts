import { MeshBuilder, Scene } from "@babylonjs/core";

export function createAimingPlane(scene: Scene) {
	const mesh = MeshBuilder.CreatePlane("Aiming Pick Position Plane", {size: 200}, scene);
	mesh.setEnabled(false);
	return (mesh);
}