import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'

/**
 * Uses Notification system to display custom message based on if this client is active
 */
function turnMessage(machine: StateMachine) {
	if (machine.isActiveUser()) {
		machine.guiHelper?.notifications.add("Move with WASD, then confirm with Space");
	}
	else {
		machine.guiHelper?.notifications.add(`${machine.getActiveUser().name} is worming around`);
	}
}

export class MovementState implements IState {
	private next: boolean = false;
	// Constructor called once pet Canvas
	constructor(private machine: StateMachine) {}

	enter() {
		this.reset()

		// Setup
		turnMessage(this.machine);

		// Actions
		const action = this.machine.scene.actionManager;

		// For inactive players, dont allow picking worms
		if (!this.machine.isActiveUser())
			return ;

		// Confirm movement to be done
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));
	}

	tick() {
		if (this.next && this.machine.isActiveUser()) {
			this.machine.sendRequestStatePacket(GameState.AIMING);
			this.next = false;
		}
	}

	exit() {
		this.reset()
	}

	reset(): void {
		this.next = false;
	}
}