import { Scene, Mesh } from "@babylonjs/core";
import { Turn } from "../../../4_turn_start/Turn";
import { IAimType } from "./IAimType";

export class PickPosition implements IAimType {
	private trackingFunction: (() => void) | undefined;
	private active: boolean = false;
	private marker: Mesh | undefined;
	private plane: Mesh | undefined;
	constructor() {
		this.trackingFunction = undefined;
		this.marker = undefined;
		this.plane = undefined
	}

	activate(turn: Turn, scene: Scene): void {
		if (this.active)
			return ;
		this.active = true;
		turn.aiming.seperatedOrigin = true;

		this.marker = turn.aiming.originMarker;
		this.plane = turn.aiming.originPlane;
		this.marker.visibility = 1;
		// Credit: https://forum.babylonjs.com/t/vector3-unproject-onto-xz-plane/31056
		this.trackingFunction = () => {
			if (scene.getFrameId() <= 1)
				return ;
			// Generate Point from camera onto plane, to get intersection coordinates in worldspace
			const pickedPoint = scene.pick(
				scene.pointerX, 
				scene.pointerY, 
				(mesh) => (
					mesh === this.plane
				)
			).pickedPoint;
			if (pickedPoint && this.marker) {
				this.marker.position.copyFrom(pickedPoint);
			}
		}
		this.active = true;
		scene.registerBeforeRender(this.trackingFunction);
	}

	deactivate(scene: Scene): void {
		if (!this.active)
			return ;
		
		this.active = false;
		if (this.marker)
			this.marker.visibility = 0;
		if (this.trackingFunction)
			scene.unregisterBeforeRender(this.trackingFunction);
	}
}