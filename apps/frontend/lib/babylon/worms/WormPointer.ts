import { MeshBuilder, Mesh, ActionManager, Scene, Nullable, Observer } from '@babylonjs/core';

export class WormPointer {
	private sceneRef: Scene;
	private mesh: Mesh;
	public target: Mesh | undefined;
	public offset: number = 0.5;
	public distance: number = 0.5;
	public radiansPerFrame: number = 3 / 180 * Math.PI;
	private progress: number = 0;
	private progressPerFrame: number;
	private animation: Nullable<Observer<Scene>>;
	constructor (scene: Scene, target: Mesh | undefined = undefined) {
		this.sceneRef = scene;
		this.target = target;

		// Create Mesh
		const width = 0.6;
		const height = 0.15;
		const length = 1;
		const angle = (30) / 180 * Math.PI;
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
		this.mesh = Mesh.MergeMeshes([middle, right, left], true, false, null, false, false);
		this.mesh.actionManager = new ActionManager(scene);

		// Animation
		const DURATION = 2;
		const FPS = 60;
		const VALUE = 2;
		const LOOP_VALUE = 2 * Math.PI;
		this.progressPerFrame = VALUE / (FPS * DURATION);
		this.animation = scene.onBeforeRenderObservable.add(() => {
			this.mesh.rotation.y = (this.mesh.rotation.y + this.radiansPerFrame) % LOOP_VALUE;
			this.mesh.position.x = (this.target) ? this.target.position.x : 0;
			this.mesh.position.y = (this.target) ? this.target.position.y : 0;
			this.mesh.position.y += this.offset + (Math.sin(this.progress * Math.PI) + 1 ) * this.distance;
			this.progress = (this.progress + this.progressPerFrame) % VALUE;
		});
	}

	dispose() {
		if (this.animation)
			this.sceneRef.onBeforeRenderObservable.remove(this.animation);
		this.mesh.dispose();
	}
}