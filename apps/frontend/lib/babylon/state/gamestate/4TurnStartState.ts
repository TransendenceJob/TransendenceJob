import { IState } from './IState'
import { StateMachine } from '../StateMachine';
// @ts-ignore
import { GameState } from '../../../../shared/state/GameState';
// @ts-ignore
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'
import { Turn } from '../Turn';

export class TurnStartState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() : Array<IAction> {
		this.reset()

		// Setup
		const chosenPlayer = this.machine.players[this.machine.turnOrder[0]];
		this.machine.guiHelper?.notifications.add(`${chosenPlayer.name} starts their Turn`)
		this.machine.turn = new Turn(chosenPlayer);

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
			this.machine.sendStatePacket(GameState.PICK_WORM);
		}
	}

	exit() {
		this.reset()
	}

	reset(): void {
		this.next = false;
	}
}