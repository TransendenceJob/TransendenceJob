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
		if (!this.machine.loaded)
			return ;

		// Setup
		turnMessage(this.machine);
		const turn = this.machine.loaded.turn;
		this.pointer = new WormPointer(this.machine.scene, turn.chosenWorm.collider);
		this.pointer.target = (turn) ? turn.chosenWorm.collider : undefined;
		
		// Actions
		const action = this.machine.scene.actionManager;
		
		// For inactive players, dont allow picking worms
		if (!this.machine.isActiveUser())
			return ;

		// Allow worms to be chosen by clicking on their mesh
		turn.activePlayer.wormsClickable(true, (worm: Worm) => {
			console.log("Picking wory boy");
			this.pickWorm(worm);
			this.machine.msgToServer<CS_WormChosen>(CS_Type.CS_WormChosen, {
				wormId: worm.id ?? 0,
			})
		});

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
				wormId: turn.chosenWorm.id ?? 0,
			})
		}));
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "a"
		}, () => {
			this.getNextWorm(false);
			this.machine.msgToServer<CS_WormChosen>(CS_Type.CS_WormChosen, {
				wormId: turn.chosenWorm.id ?? 0,
			})
		}));
	}

	/**
	 * Moves the active player to the next worm
	 * @returns 
	 */
	private getNextWorm(forward: boolean) {
		if (!this.machine.loaded)
			return ;
		const next_worm = this.machine.loaded.turn.activePlayer.getNextWorm(forward, this.machine.loaded.turn.chosenWorm);
		this.pickWorm(next_worm);
	}

	/**
	 * Chooses a new worm and places the chosen weapon on them, if possible
	 * @param newWorm New worm to choose
	 */
	private pickWorm(newWorm: Worm) {
		if (!this.machine.loaded)
			return ;
		const turn = this.machine.loaded.turn;
		turn.chosenWorm = newWorm;
		if (!turn.chosenWeapon)
			return ;
		turn.chosenWeapon.mesh.position.x = turn.chosenWorm.collider.position.x;
		turn.chosenWeapon.mesh.position.y = turn.chosenWorm.collider.position.y;

	}

	tick() {
		if (!this.machine.loaded)
			return ;
		const turn = this.machine.loaded.turn;
		if (this.pointer && turn && this.pointer.target != turn.chosenWorm.collider)
			this.pointer.target = turn.chosenWorm.collider;
		if (this.next && this.machine.isActiveUser()) {
			this.machine.sendRequestStatePacket(GameState.MOVEMENT);
			this.next = false;
		}
	}

	exit() {
		this.machine.loaded?.turn.activePlayer.wormsClickable(false, undefined);
		this.pointer?.dispose();
		this.pointer = undefined;
		this.reset()
	}

	reset(): void {
		this.next = false;
	}
}