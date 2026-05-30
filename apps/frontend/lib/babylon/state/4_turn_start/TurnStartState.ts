import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'
import { Turn } from './Turn';

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

	enter() {
		this.reset()
		if (!this.machine.loaded)
			return ;

		// Setup
		this.machine.loaded.turn = new Turn(
			this.machine.getActiveUser(), 
			this.machine.scene,
			this.machine.loaded.weapons.length > 0 ? this.machine.loaded.weapons[0] : undefined,
			(msg: string) => {this.machine.guiHelper?.notifications.add(msg)}
		);
		turnMessage(this.machine);

		// Actions
		const action = this.machine.scene.actionManager;
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));
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