import { IState } from './IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'
import { WormPointer } from '../../worms/WormPointer';

export class PickWormState implements IState {
	private next: boolean = false;
	private pointer: WormPointer | undefined = undefined;
	constructor(private machine: StateMachine) {}

	enter() : Array<IAction> {
		this.reset()

		// Setup
		this.machine.guiHelper?.notifications.add(`${this.machine.turn?.activePlayer.name} is picking a worm`)
		this.pointer = new WormPointer(this.machine.scene, this.machine.turn?.chosenWorm.mesh);
		this.pointer.target = (this.machine.turn) ? this.machine.turn.chosenWorm.mesh : undefined;
		
		// Actions
		const actions: Array<IAction> = [];

		// For inactive players, dont allow picking worms
		if (!this.machine.isActiveUser())
			return (actions)

		// Allow worms to be chosen by clicking on their mesh
		this.machine.turn?.activePlayer.wormsClickable(true);

		// Confirming chosen Worm
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
			this.getNextWorm(true);
		}));
		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "a"
		}, () => {
			this.getNextWorm(false);
		}));

		return (actions);
	}

	/**
	 * Moves the active player to the next worm
	 * @returns 
	 */
	private getNextWorm(forward: boolean) {
		if (!this.machine.turn)
			return ;
		const next_worm = this.machine.turn.activePlayer.getNextWorm(forward, this.machine.turn.chosenWorm);
		this.machine.turn.chosenWorm = next_worm;
	}

	tick() {
		if (this.pointer && this.machine.turn && this.pointer.target != this.machine.turn.chosenWorm.mesh)
			this.pointer.target = this.machine.turn.chosenWorm.mesh;
		if (this.next && this.machine.isActiveUser()) {
			this.machine.sendRequestStatePacket(GameState.MOVEMENT);
			this.next = false;
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