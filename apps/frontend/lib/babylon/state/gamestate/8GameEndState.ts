import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
// @ts-ignore
import { GameState } from '../../../../shared/state/GameState';
// @ts-ignore
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'

export class GameEndState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() {
		this.machine.guiHelper?.notifications.add("Game Over");

		// Setup
		this.machine.registerNewActions([]);

	}

	tick() {
	}

	exit() {
	}
}