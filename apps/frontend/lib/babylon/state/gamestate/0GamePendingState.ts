import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
// @ts-ignore
import { GameState } from '../../../../shared/state/GameState';
// @ts-ignore
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'
import { createPlayers, Player } from '../../Player';
import { points } from '../../data/vectorData';
import { colors } from '../../data/gameData';
import { spawnWorms } from '../../worms/spawnWorms';
import createGui from '../../createGui';
import { Ground } from '../../Ground';

export class GamePendingState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() {
		console.log("BABYLON: State: Game Pending");

		// Setup
		this.machine.setupGame()

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
			this.machine.setState(GameState.GAME_START);
			return ;
		}
	}

	exit() {
		console.log("BABYLON: State: Exiting Game Pending");
		this.next = false;
	}
}