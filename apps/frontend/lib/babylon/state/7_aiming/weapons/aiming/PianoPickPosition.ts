import { Scene, Mesh, AbstractMesh	 } from "@babylonjs/core";
import { activateParam, IAimType } from "./IAimType";
import { aimingMeshes } from '../../../1_loading/loadGame';
import { ImportMesh } from '@/lib/babylon/state/1_loading/ImportMesh';
import { msgToServerType } from "@/lib/packets/msgToServerType";
import { CS_AimMoveTarget, CS_SwitchAimState, CS_Type } from "@/shared/packets/ClientServerPackets";
import { aimStateId } from "@/shared/packets/util";

export class PianoPickPosition implements IAimType {
	private actions: Array<() => void>;
	private active: boolean = false;
	private target: ImportMesh;
	private plane: Mesh;
	private message: string = "Move your mouse to choose a position. Confirm with Space"
	private height: number = 34;
	private msgToServer: msgToServerType;
	constructor(aimMeshes: aimingMeshes, msgToServer: msgToServerType) {
		this.target = aimMeshes.target;
		this.plane = aimMeshes.plane;
		this.actions = [];
		this.msgToServer = msgToServer;
	}

	activate(params: activateParam) {
		if (this.active || params.turn == undefined)
			return ;
		this.active = true;
		params.broadcast(this.message);
		this.msgToServer<CS_SwitchAimState>(CS_Type.CS_SwitchAimState, {
			entering: true,
			stateId: aimStateId.PianoPickPosition,
		});

		const turn = params.turn;
		const scene = params.scene;
		turn.aiming.seperatedTarget = true;
		turn.aiming.targetDirection.position.y = this.height;
		this.target.mesh.position.y = this.height;
		this.target.show(true);
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
			if (pickedPoint) {
				this.msgToServer<CS_AimMoveTarget>(CS_Type.CS_AimMoveTarget, {
					point: {
						x: pickedPoint.x,
						y: this.height,
					}
				})
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
		
		// Hide target marker mesh
		this.msgToServer<CS_SwitchAimState>(CS_Type.CS_SwitchAimState, {
			entering: false,
			stateId: aimStateId.PianoPickPosition,
		});
		this.active = false;
		this.target.show(false);
		this.actions.forEach((action: () => void) => {
			scene.unregisterBeforeRender(action);
		})
	}
}