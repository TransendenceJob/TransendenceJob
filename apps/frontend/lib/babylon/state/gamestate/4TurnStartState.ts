import { IState } from './IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'
import { Turn } from '../Turn';
import { Player } from "../../Player";

/**
 * Uses Notification system to display custom message based on if this client is active
 */
function turnMessage(machine: StateMachine) {
	if (machine.isActiveUser()) {
		machine.guiHelper?.notifications.add("It is your Turn");
	}
	else {
		machine.guiHelper?.notifications.add(`${machine.getActiveUser().name} starts their Turn`);
	}
}

export class TurnStartState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() : Array<IAction> {
		this.reset()

		// Setup
		this.machine.turn = new Turn(this.machine.getActiveUser());
		turnMessage(this.machine);

		// Actions
		const actions: Array<IAction> = [];

		// DEV TOOL skip to next state manually by pressing Space
		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));
		return (actions);
	}

	tick() {
		if (this.next) {
			this.machine.sendForceStatePacket(GameState.PICK_WORM);
		}
	}

	exit() {
		this.reset()
	}

	reset(): void {
		this.next = false;
	}
}