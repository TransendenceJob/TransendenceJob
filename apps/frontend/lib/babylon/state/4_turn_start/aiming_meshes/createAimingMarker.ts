import { MeshBuilder, Scene } from "@babylonjs/core";

export function createAimingMarker(scene: Scene) {
	const mesh = MeshBuilder.CreateSphere("Aiming Pick Position Marker", {segments: 2}, scene);
	mesh.visibility = 0;
	mesh.renderingGroupId = 1;
	return (mesh);
}
