import { CS_Type, CS_WeaponChosen } from '@/shared/packets/ClientServerPackets';
import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction, AbstractActionManager } from '@babylonjs/core'

/**
 * Uses Notification system to display custom message based on if this client is active
 */
function turnMessage(machine: StateMachine) {
	if (machine.isActiveUser()) {
		machine.guiHelper?.notifications.add("Move with ?, switch weapons with 0-9 then confirm with Space");
	}
	else {
		machine.guiHelper?.notifications.add(`${machine.getActiveUser().name} is worming around`);
	}
}

function manuallyChooseWeapon(action: AbstractActionManager, machine: StateMachine) {
	if (!machine.loaded) 
		return ;
	for (let i = 0; i < 9; i++) {
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: `${i + 1}`
		}, () => {
			if (!machine.loaded)
				return ;
			console.log("Manually chose weapon");
			const weapon = machine.loaded.weapons.find((weapon) => (weapon.weaponId == i));
			machine.msgToServer<CS_WeaponChosen>(CS_Type.CS_WeaponChosen, {
				id: (weapon?.weaponId ?? 0)
			});
		}));
	}
}

export class MovementState implements IState {
	private next: boolean = false;
	// Constructor called once pet Canvas
	constructor(private machine: StateMachine) {}

	enter() {
		this.reset();
		if (!this.machine.loaded)
			return;

		// Setup
		turnMessage(this.machine);

		// Actions
		const action = this.machine.scene.actionManager;

		// Display first weapon as default
		console.log("First weapon chosen");
		this.machine.loaded.turn.chooseWeapon(this.machine.loaded.weapons[0]);

		// For inactive players, dont allow picking worms
		if (!this.machine.isActiveUser())
			return ;

		// Allow registering of weapons for the active user
		manuallyChooseWeapon(action, this.machine);

		// Confirm movement to be done
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));
	}

	tick() {
		if (this.next && this.machine.isActiveUser()) {
			this.machine.sendRequestStatePacket(GameState.AIMING);
			this.next = false;
		}
	}

	exit() {
		this.reset()
	}

	reset(): void {
		this.next = false;
	}
}