import { IState } from './IState'
import { StateMachine } from '../StateMachine';
// @ts-ignore
import { GameState } from '../../../../shared/state/GameState';
// @ts-ignore
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'
import { fadeAnimation } from '../../fadeAnimation';

export class GameStartState implements IState {
	constructor(private machine: StateMachine) {}

	enter() : Array<IAction> {
		this.reset()

		// Setup
		this.machine.guiHelper?.notifications.add("A new game has begun")
		this.machine.guiHelper?.notifications.start();
		fadeAnimation(this.machine.scene, true);

		// Actions

		return([]);
	}

	tick() {
	}

	exit() {
		this.reset()
	}

	reset(): void {
	}
}