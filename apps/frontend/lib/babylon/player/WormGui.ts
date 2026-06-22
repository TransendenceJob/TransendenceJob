import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { Worm } from "./Worm";
import { Color3, Matrix, AbstractMesh, Scene, Vector3, Observable, Observer } from "@babylonjs/core";

// Credit to ClaudeAi
function worldToScreen(worldPosition: Vector3, scene: Scene, width: number, height: number) {
    return Vector3.Project(worldPosition,
        Matrix.Identity(),
        scene.getTransformMatrix(),
        scene.cameras[0].viewport.toGlobal(
            width,
            height
        )
    );
}

/**
 * Class to show health counters with Gui for all worms
 */
export class WormGui {
	private healthOffset = 1;
	private nameOffset = 1.75;
	private meshRef: AbstractMesh;
	private sceneRef: Scene;
	private hud: AdvancedDynamicTexture;
	private healthGui: TextBlock;
	private nameGui: TextBlock;
	private action: Observer<Scene>;
	public health: number;

	constructor(
		scene: Scene, 
		canvas: HTMLCanvasElement, 
		mesh: AbstractMesh, 
		health: number,
		color: Color3,
		name: string,
	) {
		this.meshRef = mesh;
		this.health = health;
		this.hud = AdvancedDynamicTexture.CreateFullscreenUI(
			"HealthCounter",
			true,
			scene,
		);
		this.healthGui = new TextBlock("Worm Health Gui", health.toString());
		this.healthGui.color = color.toHexString();
		this.hud.addControl(this.healthGui);
		this.nameGui = new TextBlock("Worm Name Gui", name);
		this.nameGui.color = color.toHexString();
		this.hud.addControl(this.nameGui);
		this.sceneRef = scene;
		this.action = this.sceneRef.onBeforeRenderObservable.add(() => {
			const position = this.meshRef.position.clone();
			position.y += this.healthOffset;
			let pos = worldToScreen(position, scene, canvas.width, canvas.height);
			this.healthGui.left = pos.x - canvas.width / 2;
			this.healthGui.top = pos.y - canvas.height / 2;
			this.healthGui.text = this.health.toString();
			position.y += this.nameOffset - this.healthOffset;
			pos = worldToScreen(position, scene, canvas.width, canvas.height);
			this.nameGui.left = pos.x - canvas.width / 2;
			this.nameGui.top = pos.y - canvas.height / 2;
		});
	}

	dispose() {
		this.sceneRef.onBeforeRenderObservable.remove(this.action);
		this.nameGui.dispose();
		this.healthGui.dispose();
		this.hud.dispose();
	}
}