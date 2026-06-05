import { Turn } from "@/lib/babylon/state/4_turn_start/Turn";
import { activateParam, IAimType } from "./IAimType";
import { IAction, ExecuteCodeAction, ActionManager, Mesh, Scene, AbstractMesh } from '@babylonjs/core';
import { aimingMeshes, weaponHelper } from '../../../1_loading/loadGame';
import { msgToServerType } from "@/lib/packets/msgToServerType";
import { CS_AimTargetAngle, CS_SwitchAimState, CS_Type } from "@/shared/packets/ClientServerPackets";
import { aimStateId } from "@/shared/packets/util";

const pi2 = Math.PI * 2;

export interface switchTargetAngleParam {
	snapAngle: number, 
	minAngle: number, 
	maxAngle: number, 
	startAngle: number | undefined
}

/**
 * Aiming Type, where the client may use A and D to rotate the target points rotation/direction
 * Mainly used for air strikes, to switch which direction they are going in
 */
export class SwitchTargetAngle implements IAimType {
	private active: boolean = false;
	private actions: Array<IAction> = [];
	private meshRef: AbstractMesh;
	private snapAngle: number;
	private startAngle: number;
	private turnLeft: boolean = false;
	private turnRight: boolean = false;
	private allowedAngleMin: number;
	private allowedAngleMax: number;
	private span: number;
	private message: string = "Use A and D to switch between angles. Confirm with Space";
	private msgToServer: msgToServerType;

	constructor(data: switchTargetAngleParam, weaponHelper: weaponHelper, msgToServer: msgToServerType) {
		this.snapAngle = data.snapAngle;
		this.allowedAngleMin = data.minAngle;
		this.allowedAngleMax = data.maxAngle;
		this.span = (data.maxAngle - data.minAngle + pi2) % pi2;
		this.startAngle = data.startAngle ?? 0;
		this.meshRef = weaponHelper.direction;
		this.msgToServer = msgToServer
	}

	activate(params: activateParam) {
		if (this.active || params.turn == undefined)
			return ;
		this.active = true;
		params.broadcast(this.message);
		const turn = params.turn;
		// Change visibility of meshes
		this.msgToServer<CS_SwitchAimState>(CS_Type.CS_SwitchAimState, {
			entering: true,
			stateId: aimStateId.SwitchTargetAngle,
		});
		this.msgToServer<CS_AimTargetAngle>(CS_Type.CS_AimTargetAngle, {
			angle: this.startAngle,
		});

		turn.aiming.targetAngle = this.startAngle;
		this.meshRef.position.copyFrom(turn.aiming.target.mesh.position);
		this.meshRef.setEnabled(true);

		// Turn left
		this.actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: "a"
		}, () => { this.turnLeft = true; }));
		this.actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "a"
		}, () => { this.turnLeft = false; }));
		
		// Turn right
		this.actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: "d"
		}, () => { this.turnRight = true; }));
		this.actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "d"
		}, () => { this.turnRight = false; }));

		// Actually turn
		this.actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnEveryFrameTrigger,
		}, () => {
			let newAngle = turn.aiming.targetAngle;
			if (!this.turnRight && !this.turnLeft)
				return ;
			if (this.turnRight) {
				newAngle += this.snapAngle;
			}
			if (this.turnLeft) {
				newAngle -= this.snapAngle;
			}

			
			// Lock movement when angles arent fully open
			if (this.allowedAngleMin == 0 && this.allowedAngleMax == pi2) {
				turn.aiming.targetAngle = (newAngle + pi2) % pi2;
			} else {
				const relativeAngle = (newAngle - this.allowedAngleMin + pi2) % pi2;
				if (relativeAngle <= this.span) {
					turn.aiming.targetAngle = (newAngle + pi2) % pi2;
				}
				else if (this.turnLeft) {
					turn.aiming.targetAngle = this.allowedAngleMin;
				}
				else if (this.turnRight) {
					turn.aiming.targetAngle = this.allowedAngleMax;
				}
			}
			this.msgToServer<CS_AimTargetAngle>(CS_Type.CS_AimTargetAngle, {
				angle: turn.aiming.targetAngle
			});
			this.turnRight = false;
			this.turnLeft = false;
		}));

		this.actions.forEach(
			(action) => {
				if (action) 
					params.scene.actionManager.registerAction(action);
			}
		);
	}

	deactivate(scene: Scene) {
		if (!this.active)
			return ;
		this.msgToServer<CS_SwitchAimState>(CS_Type.CS_SwitchAimState, {
			entering: false,
			stateId: aimStateId.SwitchTargetAngle,
		});
		this.meshRef.setEnabled(false);
		this.active = false;
		this.turnLeft = false;
		this.turnRight = false;
		this.actions.forEach(
			(action) => {
				if (action) 
					scene.actionManager.unregisterAction(action)
			}
		);
		this.actions = [];
	}
}