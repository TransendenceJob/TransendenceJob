import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager } from '@babylonjs/core'

export class GameLoadingState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() {
		console.log('Entered Loading State');
		// Setup
		this.machine.setupGame()
		this.machine.guiHelper?.notifications.add("Finished loading")

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
			this.machine.sendForceStatePacket(GameState.GAME_START);
		}
	}

	exit() {
		this.reset();
	}

	reset(): void {
		this.next = false;
	}
}