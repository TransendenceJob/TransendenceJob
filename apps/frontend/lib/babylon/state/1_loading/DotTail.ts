import { ActionManager, Color3, ExecuteCodeAction, Mesh, MeshBuilder, Scene, StandardMaterial } from "@babylonjs/core";
import { ImportMesh } from "./ImportMesh";

/**
 * Group of black dots going vertically across the screen,
 * following the x position fo a certain head Mesh
 */
export class DotTail {
	private meshCount = 20;
	private meshes: Array<Mesh>;
	private headMesh: ImportMesh
	private actions: Array<ExecuteCodeAction>;
	private disposed = false;
	private scene: Scene;
	private active: boolean = false;
	constructor(top: number, bottom: number, headMesh: ImportMesh, scene: Scene) {
		const diff = (top - bottom) / this.meshCount;
		const diameter = (top - bottom) / (this.meshCount * 8);
		this.scene = scene;
		this.meshes = [];
		for (let i = 0; i < this.meshCount; i++) {
			const newest = MeshBuilder.CreateSphere(`Aiming dotted tail mesh ${i}`, {
				segments: 6,
				diameter: diameter,
			}, scene);
			newest.position.y = top - ((i + 1) * diff);
			newest.renderingGroupId = 1;
			const material = new StandardMaterial("material", scene);
			material.diffuseColor = new Color3(0.05, 0.05, 0.05);
			newest.material = material;
			newest.setEnabled(false);
			this.meshes.push(newest);
		}
		this.headMesh = headMesh;
		this.actions = [];
	}

	show(yes: boolean) {
		this.meshes.forEach((mesh) => {
			mesh.setEnabled(yes);
		});
	}

	activate() {
		if (this.active)
			return
		this.active = true;
		this.show(true);
		this.actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnEveryFrameTrigger
		}, () => {
			let lastPos: number = this.headMesh.mesh.position.x;
			let temp: number;
			for (let i = 0; i < this.meshCount; i++) {
				temp = this.meshes[i].position.x;
				this.meshes[i].position.x = lastPos;
				lastPos = temp;
			}
		}));
		this.scene.actionManager.registerAction(this.actions[0]);
	}

	deactivate() {
		if (!this.active)
			return ;
		this.active = false;
		this.show(false);
		this.scene.actionManager.unregisterAction(this.actions[0]);
		this.actions = [];
	}

	dispose() {
		if (this.disposed)
			return ;
		this.disposed = true;
		this.deactivate();
		this.meshes.forEach(mesh => {
			mesh.dispose()
		});
		this.meshes = [];
	}
}