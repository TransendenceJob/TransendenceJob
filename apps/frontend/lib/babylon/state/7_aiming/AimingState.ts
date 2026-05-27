import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction } from '@babylonjs/core'
import { aimingHelper, Turn } from '../4_turn_start/Turn';
import { IWeapon } from './weapons/IWeapon';
import { CS_EndAimState, CS_Type } from '@/shared/packets/ClientServerPackets';

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

function sendAimingDone(machine: StateMachine) {
	if (!machine.turn)
		return ;
	const data: aimingHelper = machine.turn.aiming;
	const pos_x = data.seperatedOrigin ? 
		data.originMarker.position.x :
		machine.turn.chosenWeapon?.getProjectileSpawnPos().x ??
		0;
	const pos_y = data.seperatedOrigin ? 
		data.originMarker.position.y : 
		machine.turn.chosenWeapon?.getProjectileSpawnPos().y ??
		0;
	machine.msgToServer<CS_EndAimState>(CS_Type.CS_EndAimState, {
		angle: data.angle,
		force: data.force,
		position: {
			x: pos_x,
			y: pos_y,
		}
	});
}

export class AimingState implements IState {
	private next: boolean = false;
	private cancelAiming: boolean = false;
	private weapon: IWeapon | undefined = undefined;
	private aimingPhase: number = 0;
	private phaseCount: number = 0;
	constructor(private machine: StateMachine) {}

	enter() {
		this.reset()

		// Setup
		turnMessage(this.machine);

		// Actions
		const action = this.machine.scene.actionManager;

		// Force a chosen worm and weapon
		if (!this.machine.turn)
			this.machine.turn = new Turn(this.machine.players[0], this.machine.scene);
		const turn = this.machine.turn;
		if (!turn.chosenWorm)
			turn.chosenWorm = turn.activePlayer.worms[0];
		// Choose random Weapon, if no weapon chosen
		if (!turn.chosenWeapon) {
			const range = this.machine.weapons.length - 1
			const randomWeaponIndex = (Math.round(Math.random() * range))
			this.weapon = this.machine.weapons[randomWeaponIndex]
			this.machine.guiHelper?.notifications.add(`No Weapon was chosen, picking random one: ${this.weapon.name}`)
		} else {
			this.weapon = turn.chosenWeapon;
		}
		turn.chooseWeapon(this.weapon);
		this.phaseCount = this.weapon.aimTypes.length;

		// For inactive players, dont allow picking worms
		if (!this.machine.isActiveUser())
			return ;

		// Confirm Aiming to be done
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));
		// Cancel Aiming and go back to beginning
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "q"
		}, () => {
			this.cancelAiming = true;
		}));

		// Activate the first aiming type for the Weapon
		this.machine.turn?.chosenWeapon?.aimTypes[0].activate(this.machine.turn, this.machine.scene);
	}

	tick() {
		// User changes aiming to next type
		if (this.cancelAiming) {
			this.cancelAiming = false;
			this.switchAimingPhase(0);
		}
		else if (this.machine.isActiveUser() && this.next) {
			this.next = false;
			this.switchAimingPhase(this.aimingPhase + 1);
		}
		this.machine.turn?.turnWeapon();
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

	/**
	 * Switches to different Phase of aiming,
	 * also handles resetting back to 0, 
	 * and sending packet to move to next state
	 * @param state State with current aiming phase information
	 * @param newPhase phase of aiming to switch to
	 */
	switchAimingPhase(newPhase: number) {
		if (newPhase == 0 && this.machine.turn) {
			const aiming = this.machine.turn.aiming;
			aiming.angle = 0;
			aiming.force = 1;
			aiming.seperatedOrigin = false;
		}
		this.weapon?.aimTypes[this.aimingPhase].deactivate(this.machine.scene);
		if (newPhase >= this.phaseCount) {
			// When finishing last state, go to End of Turn)
			sendAimingDone(this.machine);
		}
		else {
			if (this.machine.turn)
				this.weapon?.aimTypes[newPhase].activate(this.machine.turn, this.machine.scene);
			this.aimingPhase = newPhase;
		}
	}
}