import { IState } from './IState'
import { StateMachine } from '../StateMachine';
// @ts-ignore
import { GameState } from '../../../../shared/state/GameState';
// @ts-ignore
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'
import { ExampleGun } from '../../weapons/ExampleGun';
import { Turn } from '../Turn';

export class AimingState implements IState {
	private next: boolean = false;
	private aimLeft: boolean = false;
	private aimRight: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() : Array<IAction> {
		this.reset()

		// Setup
		this.machine.guiHelper?.notifications.add(`Player ${this.machine.players[0].name} is aiming`)

		// Actions
		const actions: Array<IAction> = [];

		// DEV TOOL skip to next state manually by pressing Space
		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));

		// Force a chosen worm and weapon
		if (!this.machine.turn)
			this.machine.turn = new Turn(this.machine.players[0]);
		const turn = this.machine.turn;
		if (!turn.chosenWorm)
			turn.chosenWorm = this.machine.players[0].worms[0];
		if (!turn.chosenWeapon && turn.chosenWorm)
			turn.chosenWeapon = new ExampleGun(this.machine.scene, turn);

		const aimingActions = this.machine.turn?.chosenWeapon?.aimTypes[0].activate(this.machine.turn);
		aimingActions?.forEach((a) => {actions.push(a)});

		return (actions);
	}

	tick() {
		if (this.next) {
			this.machine.sendStatePacket(GameState.TURN_END);
		}
		this.machine.turn?.turnWeapon(this.machine.turn?.aimAngle);
	}

	exit() {
		this.machine.turn?.chosenWeapon?.aimTypes[0].deactivate(this.machine.scene);
		this.reset()
	}

	reset(): void {
		this.next = false;
		this.aimLeft = false;
		this.aimRight = false;
	}
}