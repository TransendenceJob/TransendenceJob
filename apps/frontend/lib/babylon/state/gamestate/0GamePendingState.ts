import { IState } from './IState'
import { StateMachine } from '../StateMachine';
// @ts-ignore
import { GameState } from '../../../../shared/state/GameState';
// @ts-ignore
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'

export class GamePendingState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() : Array<IAction> {
		this.reset()

		// Setup
		this.machine.setupGame()
		this.machine.guiHelper?.notifications.add("Finished loading")

		// Actions
		const actions: Array<IAction> = [];
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
			this.machine.sendStatePacket(GameState.GAME_START);
		}
	}

	exit() {
		this.reset()
	}

	reset(): void {
		this.next = false;
	}
}