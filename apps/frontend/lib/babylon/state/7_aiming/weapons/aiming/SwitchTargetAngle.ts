import { Turn } from "@/lib/babylon/state/4_turn_start/Turn";
import { IAimType } from "./IAimType";
import { IAction, ExecuteCodeAction, ActionManager, Mesh, Scene } from '@babylonjs/core';

const pi2 = Math.PI * 2;

export class SwitchTargetAngle implements IAimType {
	private active: boolean = false;
	private actions: Array<IAction> = [];
	private meshRef: Mesh | undefined = undefined;
	private snapAngle: number;
	private turnLeft: boolean = false;
	private turnRight: boolean = false;
	private allowedAngleMin: number;
	private allowedAngleMax: number;
	private span: number;

	constructor(snapAngle: number, minAngle: number, maxAngle: number, span: number) {
		this.snapAngle = snapAngle;
		this.allowedAngleMin = minAngle;
		this.allowedAngleMax = maxAngle;
		this.span = span;
	}

	activate(turn: Turn, scene: Scene) {
		if (this.active)
			return ;
		this.active = true;
		// Turn leftx
		this.meshRef = turn.aiming.targetDirection;
		this.meshRef.visibility = 1;
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
			if (this.turnRight) {
				newAngle += this.snapAngle;
				this.turnRight = false;
			}
			if (this.turnLeft) {
				newAngle -= this.snapAngle;
				this.turnLeft = false;
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
		}));

		this.actions.forEach(
			(action) => {
				if (action) 
					scene.actionManager.registerAction(action);
			}
		);
	}

	deactivate(scene: Scene) {
		if (!this.active)
			return ;
		this.meshRef.visibility = 0;
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