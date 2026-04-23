import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
// @ts-ignore
import { GameState } from '../../../../shared/state/GameState';
// @ts-ignore
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'

export class GamePendingState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() {
		// Setup
		this.machine.setupGame()
		this.machine.guiHelper?.notifications.add("Finished loading")

		// Actions
		const action: Array<IAction> = [];
		action.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));
		this.machine.registerNewActions(action);
	}

	tick() {
		if (this.next) {
			this.machine.sendStatePacket(GameState.GAME_START);
		}
	}

	exit() {
	}
}