import { IState } from './IState'
import { StateMachine } from '../StateMachine';
// @ts-ignore
import { GameState } from '../../../../shared/state/GameState';
// @ts-ignore
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'


/**
 * @note This state is somewhat weird:
 * When the game ends, the enter is called regularly and all interactibility is taken from the player
 * However, then it keeps tick() ing regularly
 * When the Server says to go back to Pending State,
 * ONLY THEN will it call this exit() and then the enter() from pending state, which will clear and set up a new game
 */
export class GameEndState implements IState {
	constructor(private machine: StateMachine) {}

	enter() : Array<IAction> {
		this.reset()

		// Setup
		this.machine.guiHelper?.notifications.add("Game Over");

		return ([]);

	}

	tick() {
	}

	exit() {
		// !This is only called, when the server says to go back to loading a new game!
		this.machine.clearGame();
		this.reset()
	}

	reset(): void {
	}
}