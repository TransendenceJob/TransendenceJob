import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { IAction } from '@babylonjs/core'

/**
 * Uses Notification system to display custom message based on if this client is active
 */
function turnMessage(machine: StateMachine) {
	if (machine.isActiveUser()) {
		machine.guiHelper?.notifications.add("Your Turn ends");
	}
	else {
		machine.guiHelper?.notifications.add(`${machine.getActiveUser().name} ends their turn`);
	}
}

export class TurnEndState implements IState {
	constructor(private machine: StateMachine) {}

	enter() {
		this.reset()

		// Setup
		turnMessage(this.machine);

		// Actions
	}

	tick() {
	}

	exit() {
		this.machine.loaded?.turn?.end();
		this.reset()
	}

	reset(): void {
	}
}