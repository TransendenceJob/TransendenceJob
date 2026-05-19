import { IState } from './IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'
import { Turn } from '../Turn';

/**
 * Uses Notification system to display custom message based on if this client is active
 */
function turnMessage(machine: StateMachine) {
	if (machine.isActiveUser()) {
		machine.guiHelper?.notifications.add("Aim your weapon with WASD and the mouse, then confirm with Space");
	}
	else {
		machine.guiHelper?.notifications.add(`${machine.getActiveUser().name} is aiming`);
	}
}

export class AimingState implements IState {
	private next: boolean = false;
	private aimLeft: boolean = false;
	private aimRight: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() : Array<IAction> {
		this.reset()

		// Setup
		this.machine.guiHelper?.notifications.add(`Player ${this.machine.players[0].name} is aiming`)

		// Actions
		const actions: Array<IAction> = [];

		// For inactive players, dont allow picking worms
		if (!this.machine.isActiveUser())
			return (actions)

		// Confirm Aiming to be done
		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));

		// Force a chosen worm and weapon
		if (!this.machine.turn)
			this.machine.turn = new Turn(this.machine.players[0]);
		const turn = this.machine.turn;
		if (!turn.chosenWorm)
			turn.chosenWorm = this.machine.players[0].worms[0];
		if (!turn.chosenWeapon)
			turn.chosenWeapon = this.machine.weapons[0];
		turn.chosenWeapon.show(true);
		turn.chosenWeapon.mesh.position.x = turn.chosenWorm.mesh.position.x;
		turn.chosenWeapon.mesh.position.y = turn.chosenWorm.mesh.position.y;

		const aimingActions = this.machine.turn?.chosenWeapon?.aimTypes[0].activate(this.machine.turn);
		aimingActions?.forEach((a) => {actions.push(a)});

		return (actions);
	}

	tick() {
		if (this.machine.isActiveUser() && this.next) {
			this.machine.sendRequestStatePacket(GameState.TURN_END);
			this.next = false;
		}
		this.machine.turn?.turnWeapon(this.machine.turn?.aimAngle);
	}

	exit() {
		this.machine.turn?.chosenWeapon?.aimTypes[0].deactivate(this.machine.scene);
		this.reset()
	}

	reset(): void {
		this.next = false;
		this.aimLeft = false;
		this.aimRight = false;
	}
}