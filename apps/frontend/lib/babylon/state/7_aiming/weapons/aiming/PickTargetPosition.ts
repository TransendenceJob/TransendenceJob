import { Scene, Mesh, AbstractMesh	 } from "@babylonjs/core";
import { Turn } from "../../../4_turn_start/Turn";
import { IAimType } from "./IAimType";

export class PickPosition implements IAimType {
	private actions: Array<() => void>;
	private active: boolean = false;
	private marker: Mesh | undefined;
	private plane: Mesh | undefined;
	constructor() {
		this.marker = undefined;
		this.plane = undefined;
		this.actions = [];
	}

	activate(turn: Turn, scene: Scene): void {
		if (this.active)
			return ;
		this.active = true;
		turn.aiming.seperatedTarget = true;

		this.marker = turn.aiming.targetMarker;
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
				this.marker.position.copyFrom(pickedPoint);
				turn.aiming.targetDirection.position.copyFrom(pickedPoint);
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