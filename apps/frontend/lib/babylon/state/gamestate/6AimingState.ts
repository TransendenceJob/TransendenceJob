import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
// @ts-ignore
import { GameState } from '../../../../shared/state/GameState';
// @ts-ignore
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'

export class AimingState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() {
		this.machine.guiHelper?.notifications.add(`Player ${this.machine.players[0].name} is aiming`)

		// Setup

		// Actions
		const action: Array<IAction> = [];

		// DEV TOOL skip to next state manually by pressing Space
		action.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));
		this.machine.registerNewActions(action);
	}

	tick() {
		if (this.next) {
			this.machine.sendStatePacket(GameState.TURN_END);
		}
	}

	exit() {
	}
}