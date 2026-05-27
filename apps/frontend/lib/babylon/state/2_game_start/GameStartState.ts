import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { IAction } from '@babylonjs/core'
import { fadeAnimation } from './fadeAnimation';

export class GameStartState implements IState {
	constructor(private machine: StateMachine) {}

	enter() {
		console.log('Entered Game start State');
		this.reset()

		// Setup
		this.machine.guiHelper?.notifications.add("A new game has begun")
		this.machine.guiHelper?.notifications.start();
		fadeAnimation(this.machine.scene, true);

		// Actions
	}

	tick() {
	}

	exit() {
		this.reset()
	}

	reset(): void {
	}
}