import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'
import { Turn } from '../4_turn_start/Turn';
import { IWeapon } from './weapons/IWeapon';

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
	private weapon: IWeapon | undefined = undefined;
	private aimingPhase: number = 0;
	private phaseCount: number = 0;
	constructor(private machine: StateMachine) {}

	enter() : Array<IAction> {
		this.reset()

		// Setup
		turnMessage(this.machine);

		// Actions
		const actions: Array<IAction> = [];

		// Force a chosen worm and weapon
		if (!this.machine.turn)
			this.machine.turn = new Turn(this.machine.players[0]);
		const turn = this.machine.turn;
		if (!turn.chosenWorm)
			turn.chosenWorm = turn.activePlayer.worms[0];
		// Choose random Weapon, if no weapon chosen
		if (!turn.chosenWeapon) {
			const range = this.machine.weapons.length - 1
			const randomWeaponIndex = (Math.round(Math.random() * range))
			this.weapon = this.machine.weapons[randomWeaponIndex]
			this.machine.guiHelper?.notifications.add(`No Weapon was chosen, picking random one: ${weapon.name}`)
		} else {
			this.weapon = turn.chosenWeapon;
		}
		turn.chooseWeapon(this.weapon);
		this.phaseCount = this.weapon.aimTypes.length;

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

		// Activate the first aiming type for the Weapon
		this.machine.turn?.chosenWeapon?.aimTypes[0].activate(this.machine.turn, this.machine.scene);

		return (actions);
	}

	tick() {
		// User changes aiming to next type
		if (this.machine.isActiveUser() && this.next) {
			// Next Phase
			if (this.aimingPhase + 1 < this.phaseCount) {
				console.log(`Switching to Aiming Phase ${this.aimingPhase + 1}`);

				// Take out old phases
				this.weapon?.aimTypes[this.phaseCount].deactivate(this.machine.scene);

				// Register new phases
				if (this.machine.turn)
					this.weapon?.aimTypes[this.phaseCount + 1].activate(this.machine.turn, this.machine.scene);
				this.aimingPhase++;
			}
			else {
				this.machine.sendRequestStatePacket(GameState.TURN_END);
				this.next = false;
			}
		}
		this.machine.turn?.turnWeapon(this.machine.turn?.aimAngle);
	}

	exit() {
		this.weapon?.aimTypes[this.aimingPhase].deactivate(this.machine.scene);
		this.reset()
	}

	reset(): void {
		this.next = false;
		this.weapon = undefined;
		this.aimingPhase = 0;
		this.phaseCount = 0;
	}
}