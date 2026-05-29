import { MeshBuilder, Scene, Mesh, Vector3, StandardMaterial, Color3 } from "@babylonjs/core"

const width = 0.6;
const height = 0.15;
const length = 1;
const angle = (30) / 180 * Math.PI;

function createArrow(scene: Scene): Mesh {
	const right = MeshBuilder.CreateBox("right", {height: height, width: width, depth: 0.1}, scene);
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
	pointer.rotation.z = Math.PI;
	pointer.bakeCurrentTransformIntoVertices();
	pointer.name = "Aiming Target Direction Pointer"
	return (pointer);
}

export function createAimingTargetMesh(scene: Scene): Mesh {
    const arrow = createArrow(scene);
	const material = new StandardMaterial("material", scene);
	material.emissiveColor = new Color3(1, 0.25, 0.25);
    arrow.material = material;
    arrow.visibility = 0;
	arrow.renderingGroupId = 1;
    return (arrow);
}