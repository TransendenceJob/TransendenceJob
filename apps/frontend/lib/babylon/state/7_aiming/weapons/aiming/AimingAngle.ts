import { Turn } from "@/lib/babylon/state/4_turn_start/Turn";
import { activateParam, IAimType } from "./IAimType";
import { IAction, ExecuteCodeAction, ActionManager, Scene } from '@babylonjs/core';

const pi2 = Math.PI * 2;

export interface aimingAngleParam {
	minAngle: number, 
	maxAngle: number, 
	turnSpeed: number
}

export class AimingAngle implements IAimType {
	private active: boolean = false;
	private actions: Array<IAction> = [];
	private turnLeft: boolean = false;
	private turnRight: boolean = false;
	private turnSpeed: number = 1.5;
	private allowedAngleMin: number;
	private allowedAngleMax: number;
	private span: number;
	private message: string = "Use A and D to rotate the weapon, confirm with Space";

	constructor(data: aimingAngleParam) {
		this.allowedAngleMin = data.minAngle;
		this.allowedAngleMax = data.maxAngle;
		this.span = (data.maxAngle - data.minAngle + pi2) % pi2;;
		this.turnSpeed = data.turnSpeed;
	}

	activate(params: activateParam) {
		if (this.active || params.turn == undefined)
			return ;
		this.active = true;
		params.broadcast(this.message);
		const turn = params.turn;


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
			let newAngle = turn.aiming.wormAngle;
			if (this.turnRight) {
				newAngle += this.turnSpeed;
			}
			if (this.turnLeft) {
				newAngle -= this.turnSpeed;
			}

			// Lock movement when angles arent fully open
			if (this.allowedAngleMin == 0 && this.allowedAngleMax == pi2) {
				turn.aiming.wormAngle = (newAngle + pi2) % pi2;
			} else {
				const relativeAngle = (newAngle - this.allowedAngleMin + pi2) % pi2;
				if (relativeAngle <= this.span) {
					turn.aiming.wormAngle = (newAngle + pi2) % pi2;
				}
				else if (this.turnLeft) {
					turn.aiming.wormAngle = this.allowedAngleMin;
				}
				else if (this.turnRight) {
					turn.aiming.wormAngle = this.allowedAngleMax;
				}
			}
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