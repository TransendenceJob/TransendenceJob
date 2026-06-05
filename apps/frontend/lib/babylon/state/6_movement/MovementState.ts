import { CS_Type, CS_WeaponChosen } from '@/shared/packets/ClientServerPackets';
import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { ExecuteCodeAction, ActionManager, AbstractActionManager, Vector3 } from '@babylonjs/core'
import { GameState } from '@/shared/state/GameState';

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

export interface keyInfo {
	a: boolean,
	d: boolean,
	w: boolean,
	e: boolean,
}

export class MovementState implements IState {
	private next: boolean = false;
	private now: number = 0;
	public keyStatus: keyInfo =
	{
		a: false,
		d: false,
		w: false,
		e: false
	};
	// Constructor called once pet Canvas
	constructor(public machine: StateMachine) {}

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
		if (!this.machine.isActiveUser() || !this.machine.loaded.turn)
			return ;

		// Allow registering of weapons for the active user
		manuallyChooseWeapon(action, this.machine);
		this.machine.loaded.turn.chosenWeapon?.show(true);

		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: "a"
		}, () => {
			this.keyStatus.a = true;
		}));
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "a"
		}, () => {
			this.keyStatus.a = false;
		}));

		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: "d"
		}, () => {
			this.keyStatus.d = true;
		}));
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "d"
		}, () => {
			this.keyStatus.d = false;
		}));

		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: "e"
		}, () => {
			this.keyStatus.e = true;
		}));
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "e"
		}, () => {
			this.keyStatus.e = false;
		}));

		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyDownTrigger,
			parameter: "w"
		}, () => {
			this.keyStatus.w = true;
		}));
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: "w"
		}, () => {
			this.keyStatus.w = false;
		}));


		// Confirm movement to be done
		action.registerAction(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));

	}

	tick() {
		if (!this.machine.loaded)
			return ;
		const turn = this.machine.loaded.turn;

		// Player wants to end their turn
		if (this.next && this.machine.isActiveUser()) {
			const minimialVelocity = 0.01

			// Only end turn once pllayer is on ground and velocity is 0
			if (turn.chosenWorm.onGround && turn.chosenWorm.aggregate.body.getLinearVelocity().length() < minimialVelocity) {
				this.machine.guiHelper?.notifications.add("NOW on ground");
				this.machine.sendRequestStatePacket(GameState.AIMING);
				this.next = false;
			}
		}
		if (turn.chosenWeapon) {
			turn.chosenWeapon.mesh.position.x = turn.chosenWorm.collider.position.x;
			turn.chosenWeapon.mesh.position.y = turn.chosenWorm.collider.position.y;
		}
	}

	exit() {
		if (this.machine.loaded) {
			const worm = this.machine.loaded.turn.chosenWorm;
			if (worm.airAnim?.isPlaying)
				worm.airAnim.stop();
			if (worm.walkAnim?.isPlaying)
				worm.walkAnim.stop();
			worm.idleAnim?.start(true, 1, worm.idleAnim.from, worm.idleAnim.to, false);
		}
		this.reset()
	}

	reset(): void {
		this.next = false;
		this.keyStatus.a = false;
		this.keyStatus.w = false;
		this.keyStatus.d = false;
		this.keyStatus.e = false;
	}
}