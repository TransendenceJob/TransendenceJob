import { Turn } from "../../state/Turn";
import { IWeapon } from "../IWeapon";
import { IAimType } from "./IAimType";
// @ts-ignore
import { IAction, ExecuteCodeAction, ActionManager, Scene } from '@babylonjs/core';

export class AimingAngle implements IAimType {
	private actions: Array<IAction> = [];
	private turnLeft: boolean = false;
	private turnRight: boolean = false;
	private turnSpeed: number = 1.5;
	private allowedAngleMin: number;
	private allowedAngleMax: number;
	private span: number;

	constructor(minAngle: number, maxAngle: number, span: number) {
		this.allowedAngleMin = minAngle;
		this.allowedAngleMax = maxAngle;
		this.span = span;
	}

	activate(turn: Turn): Array<IAction> {

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
			let newAngle = turn.aimAngle;
			if (this.turnRight) {
				newAngle += this.turnSpeed;
			}
			if (this.turnLeft) {
				newAngle -= this.turnSpeed;
			}
			
			// Lock movement when angles arent fully open
			if (this.allowedAngleMin == 0 && this.allowedAngleMax == 360) {
				turn.aimAngle = (newAngle + 360) % 360;
			} else {
				const relativeAngle = (newAngle - this.allowedAngleMin + 360) % 360;
				if (relativeAngle <= this.span) {
					turn.aimAngle = (newAngle + 360) % 360;;
				}
			}
		}));

		return (this.actions); 
	}

	deactivate(scene: Scene) {
		this.actions.forEach(
			(action) => {
				if (action) 
					scene.actionManager.unregisterAction(action)
			}
		);
	}
}