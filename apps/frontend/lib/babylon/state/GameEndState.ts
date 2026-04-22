import { IState } from './IState'
import { StateMachine } from './StateMachine';
import { GameState } from '../../../shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'

export class GameEndState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() {
		console.log('BABYLON: State: Game End');

		// Setup
		// Clean Players and their worms
		for (let i = 0; i < this.machine.players.length; i++)
			if (this.machine.players[i])
				this.machine.players[i].dispose();
		this.machine.players = [];
		this.machine.guiHelper?.dispose()
		this.machine.guiHelper = undefined;
		this.machine.ground = undefined;

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
			this.machine.setState(GameState.GAME_PENDING);
			return ;
		}
	}

	exit() {
		console.log("BABYLON: State: Exiting Game End");
		this.next = false;
	}
}