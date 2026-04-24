// @ts-ignore
import { Scene, Mesh, MeshBuilder, Vector3, StandardMaterial, Color3 } from '@babylonjs/core'
import { AimingAngle } from "./aiming/AimingAngle";
import { IAimType } from "./aiming/IAimType";
import { Explosion } from "./Explosion";
import { IWeapon } from "./IWeapon";
import { Worm } from '../worms/Worm';
import { Turn } from '../state/Turn';

/**
 * Function to create Mesh for this weapon
 * @param scene Scene in which to create meshes
 * @returns Mesh for weapon
 */
function createMesh(scene: Scene): Mesh {
    const gun_meshes = [];

	const trigger = MeshBuilder.CreateBox("trigger", {height: 0.025, width:  0.075, depth: 0.05}, scene);
	trigger.rotation.z = (10) / 180 * Math.PI;
	trigger.position = new Vector3(0, 0, 0);
	gun_meshes.push(trigger);

	const barrel = MeshBuilder.CreateBox("barrel", {height: 0.5, width: 0.1, depth: 0.0755}, scene);
	barrel.rotation.z = (1) / 180 * Math.PI;
	barrel.position = new Vector3(-0.075, 0.075, 0);
	gun_meshes.push(barrel);

	const handle = MeshBuilder.CreateBox("handle", {height: 0.1, width: 0.25, depth: 0.075}, scene);
	handle.rotation.z = (-10) / 180 * Math.PI;
	handle.position = new Vector3(0.08, -0.1, 0);
	gun_meshes.push(handle);

	const guard_1 = MeshBuilder.CreateBox("guard_1", {height: 0.175, width: 0.025, depth: 0.0625}, scene);
	guard_1.rotation.z = (5) / 180 * Math.PI;
	guard_1.position = new Vector3(0.07, 0.02, 0);
	gun_meshes.push(guard_1);

	const guard_2 = MeshBuilder.CreateBox("guard_2", {height: 0.025, width: 0.15, depth: 0.0625}, scene);
	guard_2.rotation.z = (-5) / 180 * Math.PI;
	guard_2.position = new Vector3(0., 0.1, 0);
	gun_meshes.push(guard_2);

	// Offset, because turning should happen "at the wrist"
	gun_meshes.forEach((mesh) => {
		mesh.position.y += 0.3;
		mesh.position.x += -0.15;
	})

	var gun: Mesh = Mesh.MergeMeshes(gun_meshes, true, false, null, false, false);

	var material = new StandardMaterial("gun_material", scene);
    const color = 0.15;
    const brightness = 0.05;
	material.diffuseColor = new Color3(color, color, color);
	material.emissiveColor = new Color3(brightness, brightness, brightness);

	gun.material = material;
	return (gun);
}

// 359 ->... 0
// 0 -> 360
// 360 - angle

export class ExampleGun implements IWeapon {
	// Required for all weapons:
	public weaponId = 1;
	public name = "Example Gun";
	public allowedAngleMin = 0;
	public allowedAngleMax = 360;
	public span = (this.allowedAngleMax - this.allowedAngleMin + 360) % 360;
	public projectileCount = 1;
	public speed = 1;
	public spread = 0;
	public damage = 10;
	public explosion: Explosion = {
		size: 1, 
		damage: 4, 
		affectTerrain: true
	};
	public mesh;
	public aimTypes: Array<IAimType>;

	constructor(scene: Scene, turn: Turn) {
		this.mesh = createMesh(scene);
		this.mesh.position.x = turn.chosenWorm?.mesh.position.x;
		this.mesh.position.y = turn.chosenWorm?.mesh.position.y;
		this.mesh.position.z = turn.chosenWorm?.mesh.position.z - 0.55;
		// Needs to be called last, so weapon is properly initialised with relevant data
		this.aimTypes = [
			new AimingAngle(this.allowedAngleMin, this.allowedAngleMax, this.span),
		]
		turn.aimAngle = this.allowedAngleMin + this.span / 2;
		this.mesh.rotation.z = ((360 - turn.aimAngle) % 360) / 180 * Math.PI;
	}

	dispose() {
		this.mesh.dispose();
	}
}
