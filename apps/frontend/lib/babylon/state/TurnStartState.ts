import { IState } from './IState'
import { StateMachine } from './StateMachine';
import { GameState } from '../../../shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'

export class TurnStartState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() {
		console.log('BABYLON: State: Turn Start');

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
			this.machine.setState(GameState.PICK_WORM);
			return ;
		}
	}

	exit() {
		console.log("BABYLON: State: Exiting Turn Start");
		this.next = false;
	}
}