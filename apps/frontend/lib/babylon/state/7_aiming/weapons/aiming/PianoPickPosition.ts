import { Scene, Mesh, AbstractMesh	 } from "@babylonjs/core";
import { activateParam, IAimType } from "./IAimType";

export class PianoPickPosition implements IAimType {
	private actions: Array<() => void>;
	private active: boolean = false;
	private marker: Mesh | undefined;
	private plane: Mesh | undefined;
	private message: string = "Move your mouse to choose a position. Confirm with Space"
	private height: number = 34;
	constructor() {
		this.marker = undefined;
		this.plane = undefined;
		this.actions = [];
	}

	activate(params: activateParam) {
		if (this.active || params.turn == undefined)
			return ;
		this.active = true;
		params.broadcast(this.message);

		const turn = params.turn;
		const scene = params.scene;
		turn.aiming.seperatedTarget = true;
		this.marker = turn.aiming.targetMarker;
		turn.aiming.targetDirection.position.y = this.height;
		this.marker.position.y = this.height;
		this.plane = turn.aiming.plane;
		this.marker.visibility = 1;
		// Credit: https://forum.babylonjs.com/t/vector3-unproject-onto-xz-plane/31056
		this.actions[0] = () => {
			if (scene.getFrameId() <= 1)
				return ;
			// Generate Point from camera onto plane, to get intersection coordinates in worldspace
			const pickedPoint = scene.pick(
				scene.pointerX, 
				scene.pointerY, 
				(mesh: AbstractMesh) => (
					mesh === this.plane
				)
			).pickedPoint;
			if (pickedPoint && this.marker) {
				turn.aiming.targetMarker.position.x = pickedPoint.x;
				turn.aiming.targetDirection.position.x = pickedPoint.x;
			}
		}
		this.active = true;
		this.actions.forEach((action) => {
			scene.registerBeforeRender(action)
		});
	}

	deactivate(scene: Scene): void {
		if (!this.active)
			return ;
		
		this.active = false;
		if (this.marker)
			this.marker.visibility = 0;
		this.actions.forEach((action: () => void) => {
			scene.unregisterBeforeRender(action);
		})
	}
}