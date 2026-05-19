import { IState } from './IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction, MeshBuilder } from '@babylonjs/core'

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
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() : Array<IAction> {
		this.reset()

		// Setup
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

		// Mock projectile shooting logic
		const worm = this.machine.turn?.chosenWorm;
		if (worm) {
			const pos = worm.mesh.position;
			this.machine.ground?.affectTerrain(pos.x, pos.y, 3);
		}
		return (actions);
	}

	tick() {
		if (this.next) {
			this.machine.sendForceStatePacket(GameState.GAME_END);
		}
	}

	exit() {
		this.machine.turn?.dispose();
		this.machine.turn = undefined;
		this.reset()
	}

	reset(): void {
		this.next = false;
	}
}