import { IState } from './IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'

export class MovementState implements IState {
	private next: boolean = false;
	// Constructor called once pet Canvas
	constructor(private machine: StateMachine) {}

	enter() : Array<IAction> {
		this.reset()

		// Setup
		this.machine.guiHelper?.notifications.add(`Player ${this.machine.players[0].name} is worming around`)

		// Actions
		const actions: Array<IAction> = [];

		// For inactive players, dont allow picking worms
		if (!this.machine.isActiveUser())
			return (actions)

		// Confirm movement to be done
		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));
		return (actions);
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