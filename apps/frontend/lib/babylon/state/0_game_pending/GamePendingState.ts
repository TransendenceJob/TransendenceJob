import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'

export class GamePendingState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() {
		console.log('Entered Pending State');

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
			this.machine.sendForceStatePacket(GameState.GAME_LOADING);
		}
	}

	exit() {
		this.reset()
	}

	reset(): void {
		this.next = false;
	}
}