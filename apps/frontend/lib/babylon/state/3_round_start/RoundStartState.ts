import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'

export class RoundStartState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() {
		console.log('Entered Round Start State');
		this.reset()

		// Setup
		this.machine.turn?.chosenWeapon?.show(false)
		this.machine.guiHelper?.notifications.add("A new Round has started")

		this.machine.activePlayerId = this.machine.players[0].id;

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
			this.machine.sendForceStatePacket(GameState.TURN_START);
		}
	}

	exit() {
		this.reset()
	}

	reset(): void {
		this.next = false;
	}
}