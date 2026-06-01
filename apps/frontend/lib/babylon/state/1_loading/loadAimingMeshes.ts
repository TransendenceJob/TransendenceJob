import { Scene, MeshBuilder, Mesh, AbstractMesh, Color3, StandardMaterial, ImportMeshAsync, ISceneLoaderAsyncResult } from '@babylonjs/core';
import { aimingMeshes } from './loadGame';
import { importMesh, ImportMesh } from './ImportMesh';

function createAimingPlane(scene: Scene): Mesh {
	const mesh = MeshBuilder.CreatePlane("Aiming Pick Position Plane", {size: 200}, scene);
	mesh.setEnabled(false);
	return (mesh);
}

interface arrowDimensions {
	width: number;
	height: number;
	length: number;
	angle: number;
}

function createArrow(scene: Scene, dim: arrowDimensions): Mesh {
	const right = MeshBuilder.CreateBox("right", {height: dim.height, width: dim.width, depth: 0.1}, scene);
	const width = dim.width;
	const height = dim.height;
	const length = dim.length;
	const angle = dim.angle;

	right.rotation.z = angle;
	right.position.x = Math.cos(angle) * width / 2 - Math.sin(angle) * height / 2;
	right.position.y = Math.sin(angle) * width / 2 + Math.cos(angle) * height / 2;
	const left = MeshBuilder.CreateBox("left", {height: height, width: width, depth: 0.1}, scene);
	left.rotation.z = -angle;
	left.position.x = -Math.cos(-angle) * width / 2 - Math.sin(-angle) * height / 2;
	left.position.y = -Math.sin(-angle) * width / 2 + Math.cos(-angle) * height / 2;
	const middle = MeshBuilder.CreateBox("middle", {height: length, width: height, depth: 0.1}, scene);
	middle.position.y += length / 2 + height;
	let pointer = Mesh.MergeMeshes([middle, right, left], true, false, undefined, false, false);
	if (pointer == null)
		pointer = MeshBuilder.CreateBox("", {}, scene);
	pointer.name = "Aiming Target Position Pointer"
	return (pointer);
}

function createTargetDirectionMesh(scene: Scene): Mesh {
    const arrow = createArrow(scene, {
		width: 0.4,
		height: 0.1,
		length: 1,
		angle: (45) / 180 * Math.PI,
	});
	arrow.rotation.z = Math.PI;
	arrow.bakeCurrentTransformIntoVertices();
	const material = new StandardMaterial("material", scene);
	material.emissiveColor = new Color3(1, 0.25, 0.25);
	arrow.material = material;
	arrow.visibility = 0;
	arrow.renderingGroupId = 1;
	return (arrow);
}


export async function loadAimingMeshes(scene: Scene): Promise<aimingMeshes> {

	// Target Position Marker
	const target: ImportMesh = await importMesh(scene, "Aiming Target Position Marker", "/assets/WormsReticle.obj");
	target.all[0].renderingGroupId = 1;

	// Target Direction Marker
	const direction = createTargetDirectionMesh(scene);

	// Plane for intersection checking
	const plane = createAimingPlane(scene);
	const result: aimingMeshes = {
		target,
		direction,
		plane
	};
	return (result)
}