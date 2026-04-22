import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
// @ts-ignore
import { GameState } from '../../../../shared/state/GameState';
// @ts-ignore
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'

export class PickWormState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() {
		console.log('BABYLON: State: Pick Worm');

		// Setup

		// Actions
		const action: Array<IAction> = [];
		action.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));
		this.machine.registerNewActions(action);
	}

	tick() {
		if (this.next) {
			console.log("Moving to next state");
			this.machine.setState(GameState.MOVEMENT);
			return ;
		}
	}

	exit() {
		console.log("BABYLON: State: Exiting Pick Worm");
		this.next = false;
	}
}