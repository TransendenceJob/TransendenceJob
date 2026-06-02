import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { ExecuteCodeAction, ActionManager } from '@babylonjs/core'
import { aimingHelper } from '../4_turn_start/Turn';
import { IWeapon } from './weapons/IWeapon';
import { CS_CancelAiming, CS_EndAimState, CS_Type } from '@/shared/packets/ClientServerPackets';
import { SC_CancelAiming, SC_Type } from '@/shared/packets/ServerClientPackets';

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
	if (!machine.loaded)
		return ;
	const data: aimingHelper = machine.loaded.turn.aiming;
	const pos_x = data.seperatedTarget ? 
		data.target.mesh.position.x :
		(machine.loaded.turn.chosenWeapon?.getProjectileSpawnPos()?.x ??
		machine.loaded.turn.chosenWorm.mesh.position.x);
	const pos_y = data.seperatedTarget ? 
		data.target.mesh.position.y : 
		(machine.loaded.turn.chosenWeapon?.getProjectileSpawnPos()?.y ??
		machine.loaded.turn.chosenWorm.mesh.position.x);
	machine.msgToServer<CS_EndAimState>(CS_Type.CS_EndAimState, {
		wormAngle: data.wormAngle,
		position: {
			x: pos_x,
			y: pos_y,
		},
		// Do this because BJs angles are counter clockwise, but ours are clockwise
		targetAngle: (Math.PI * 2 - data.direction.rotation.y),
		force: data.force
	});
}

export class AimingState implements IState {
	private next: boolean = false;
	public cancelAiming: boolean = false;
	private weapon: IWeapon | undefined = undefined;
	private aimingPhase: number = 0;
	private phaseCount: number = 0;
	constructor(private machine: StateMachine) {}

	enter() {
		this.reset()
		if (!this.machine.loaded)
			return ;
		// Setup
		turnMessage(this.machine);

		// Actions
		const action = this.machine.scene.actionManager;

		// Force a chosen worm and weapon
		const turn = this.machine.loaded.turn;
		if (!turn.chosenWorm)
			turn.chosenWorm = turn.activePlayer.worms[0];
		// Choose random Weapon, if no weapon chosen
		if (!turn.chosenWeapon) {
			const range = this.machine.loaded.weapons.length - 1
			const randomWeaponIndex = (Math.round(Math.random() * range))
			this.weapon = this.machine.loaded.weapons[randomWeaponIndex]
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
			this.machine.msgToServer<CS_CancelAiming>(CS_Type.CS_CancelAiming, {});
		}));

		turn.chosenWeapon?.aimTypes[0].activate({
			scene: this.machine.scene,
			turn: this.machine.loaded.turn,
			broadcast: this.machine.msgForActive
		});
	}

	tick() {
		const load = this.machine.loaded;
		if (!load)
			return ;
		// User changes aiming to next type
		if (load.turn.cancelAiming) {
			load.turn.cancelAiming = false;
			this.switchAimingPhase(0);
		}
		else if (this.machine.isActiveUser() && this.next) {
			this.next = false;
			this.switchAimingPhase(this.aimingPhase + 1);
		}
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
		if (!this.machine.loaded)
			return ;
		if (newPhase == 0) {
			const aiming = this.machine.loaded.turn.aiming;
			aiming.wormAngle = 0;
			aiming.targetAngle = 0;
			aiming.force = 1;
			aiming.seperatedTarget = false;
			aiming.target.show(false);
			aiming.direction.setEnabled(false);
			aiming.tail.deactivate();
		}
		this.weapon?.aimTypes[this.aimingPhase].deactivate(this.machine.scene);
		if (newPhase >= this.phaseCount) {
			// When finishing last state, go to End of Turn)
			sendAimingDone(this.machine);
		}
		else {
			this.weapon?.aimTypes[newPhase].activate({
				scene: this.machine.scene,
				turn: this.machine.loaded.turn,
				broadcast: this.machine.msgForActive
			});
			this.aimingPhase = newPhase;
		}
	}
}