import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'
import { WormPointer } from './WormPointer';
import { CS_Type, CS_WormChosen } from '@/shared/packets/ClientServerPackets';
import { Worm } from '../../player/Worm';

/**
 * Uses Notification system to display custom message based on if this client is active
 */
function turnMessage(machine: StateMachine) {
	if (machine.isActiveUser()) {
		machine.guiHelper?.notifications.add("Pick a Worm, then confirm with Space");
	}
	else {
		machine.guiHelper?.notifications.add(`${machine.getActiveUser().name} is picking a worm`);
	}
}

export class PickWormState implements IState {
	private next: boolean = false;
	private pointer: WormPointer | undefined = undefined;
	constructor(private machine: StateMachine) {}

	enter() {
		this.reset()

		// Setup
		turnMessage(this.machine);
		this.pointer = new WormPointer(this.machine.scene, this.machine.turn?.chosenWorm.mesh);
		this.pointer.target = (this.machine.turn) ? this.machine.turn.chosenWorm.mesh : undefined;
		
		// Actions
		const action = this.machine.scene.actionManager;
		
		// For inactive players, dont allow picking worms
		if (!this.machine.isActiveUser())
			return ;

		// Allow worms to be chosen by clicking on their mesh
		this.machine.turn?.activePlayer.wormsClickable(true, this.pickWorm);

		// Set first worm as chosen (jsut goes back and forth for proper logic)
		this.getNextWorm(true);
		this.getNextWorm(false);

		// Confirming chosen Worm
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));

		// Picking next Worm from list
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "d"
		}, () => {
			this.getNextWorm(true);
			this.machine.msgToServer<CS_WormChosen>(CS_Type.CS_WormChosen, {
				wormId: this.machine.turn?.chosenWorm.id ?? 0,
			})
		}));
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "a"
		}, () => {
			this.getNextWorm(false);
			this.machine.msgToServer<CS_WormChosen>(CS_Type.CS_WormChosen, {
				wormId: this.machine.turn?.chosenWorm.id ?? 0,
			})
		}));
	}

	/**
	 * Moves the active player to the next worm
	 * @returns 
	 */
	private getNextWorm(forward: boolean) {
		if (!this.machine.turn)
			return ;
		const next_worm = this.machine.turn.activePlayer.getNextWorm(forward, this.machine.turn.chosenWorm);
		this.pickWorm(next_worm);
	}

	/**
	 * Chooses a new worm and places the chosen weapon on them, if possible
	 * @param newWorm New worm to choose
	 */
	private pickWorm(newWorm: Worm) {
		if (!this.machine.turn)
			return ;
		const turn = this.machine.turn;
		turn.chosenWorm = newWorm;
		if (!turn.chosenWeapon)
			return ;
		turn.chosenWeapon.mesh.position.x = turn.chosenWorm.mesh.position.x;
		turn.chosenWeapon.mesh.position.y = turn.chosenWorm.mesh.position.y;

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
		this.machine.turn?.activePlayer.wormsClickable(false, undefined);
		this.pointer?.dispose();
		this.pointer = undefined;
		this.reset()
	}

	reset(): void {
		this.next = false;
	}
}