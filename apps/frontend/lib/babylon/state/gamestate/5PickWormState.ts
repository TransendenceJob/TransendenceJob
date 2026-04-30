import { IState } from './IState'
import { StateMachine } from '../StateMachine';
// @ts-ignore
import { GameState } from '../../../../shared/state/GameState';
// @ts-ignore
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'
import { WormPointer } from '../../worms/WormPointer';

export class PickWormState implements IState {
	private next: boolean = false;
	private pointer: WormPointer | undefined = undefined;
	constructor(private machine: StateMachine) {}

	enter() : Array<IAction> {
		this.reset()

		// Setup
		this.machine.guiHelper?.notifications.add(`${this.machine.players[0].name} is picking a worm`)
		this.machine.turn?.activePlayer.wormsClickable(true);
		this.pointer = new WormPointer(this.machine.scene, this.machine.turn?.chosenWorm);
		this.pointer.target = (this.machine.turn) ? this.machine.turn.chosenWorm.mesh : undefined;

		// Actions
		const actions: Array<IAction> = [];

		// DEV TOOL skip to next state manually by pressing Space
		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));

		// Picking next Worm from list
		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "d"
		}, () => {
			this.getNextWorm();
		}));
		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "a"
		}, () => {
			this.getNextWorm();
		}));

		return (actions);
	}

	/**
	 * Moves the active player to the next worm
	 * @returns 
	 */
	private getNextWorm() {
		if (!this.machine.turn)
			return ;
		const next_worm = this.machine.turn.activePlayer.getNextWorm(false, this.machine.turn.chosenWorm);
			this.machine.turn.chosenWorm = next_worm;
	}

	tick() {
		if (this.pointer && this.machine.turn && this.pointer.target != this.machine.turn.chosenWorm)
			this.pointer.target = this.machine.turn.chosenWorm.mesh;

		if (this.next) {
			this.machine.sendStatePacket(GameState.MOVEMENT);
		}
	}

	exit() {
		this.machine.turn?.activePlayer.wormsClickable(false);
		this.pointer?.dispose();
		this.pointer = undefined;
		this.reset()
	}

	reset(): void {
		this.next = false;
	}
}