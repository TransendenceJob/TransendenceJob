import { Scene, Mesh, AbstractMesh	 } from "@babylonjs/core";
import { Turn } from "../../../4_turn_start/Turn";
import { activateParam, IAimType } from "./IAimType";
import { aimingMeshes } from '../../../1_loading/loadGame';
import { ImportMesh } from '@/lib/babylon/state/1_loading/ImportMesh';

export class PickPosition implements IAimType {
	private actions: Array<() => void>;
	private active: boolean = false;
	private marker: ImportMesh;
	private plane: Mesh;
	private message: string = "Move your mouse to choose a position. Confirm with Space"
	constructor(aimMeshes: aimingMeshes) {
		this.plane = undefined;
		this.actions = [];
		this.marker = aimMeshes.target;
		this.plane = aimMeshes.plane;
	}

	activate(params: activateParam) {
		if (this.active || params.turn == undefined)
			return ;
		this.active = true;
		params.broadcast(this.message);

		const turn = params.turn;
		const scene = params.scene;
		turn.aiming.seperatedTarget = true;
		this.marker.show(true);
		// Credit: https://forum.babylonjs.com/t/vector3-unproject-onto-xz-plane/31056
		this.actions[0] = () => {
			if (scene.getFrameId() <= 1)
				return ;
			// Generate Point from camera onto plane, to get intersection coordinates in worldspace
			const pickedPoint = scene.pick(
				scene.pointerX, 
				scene.pointerY, 
				(mesh: Mesh) => (
					mesh === this.plane
				)
			).pickedPoint;
			if (pickedPoint) {
				this.marker.mesh.position.copyFrom(pickedPoint);
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
		this.marker.show(false);
		this.actions.forEach((action: () => void) => {
			scene.unregisterBeforeRender(action);
		})
	}
}