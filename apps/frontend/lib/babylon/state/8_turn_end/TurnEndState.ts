import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { ActionManager, ExecuteCodeAction, IAction, MeshBuilder, PhysicsAggregate, PhysicsMotionType, PhysicsShapeType } from '@babylonjs/core'

/**
 * Uses Notification system to display custom message based on if this client is active
 */
function turnMessage(machine: StateMachine) {
	if (machine.isActiveUser()) {
		machine.guiHelper?.notifications.add("Your Turn ends");
	}
	else {
		machine.guiHelper?.notifications.add(`${machine.getActiveUser().name} ends their turn`);
	}
}

export class TurnEndState implements IState {
	constructor(private machine: StateMachine) {}

	enter() {
		this.reset();

		// Setup
		turnMessage(this.machine);

		if (!this.machine.loaded)
			return;

		const projectile = this.machine.loaded.turn.projectile;

		// projectile.mesh.actionManager = new ActionManager(this.machine.scene);

		// projectile.mesh.actionManager.registerAction(
		// 	new ExecuteCodeAction(
		// 		{
		// 			trigger: ActionManager.OnIntersectionEnterTrigger
		// 		},
		// 		() => {
		// 			projectile.endPos = projectile.mesh.position;
		// 			// projectile.aggregate.dispose();
		// 		}
		// 	)
		// );

		// Actions
		projectile.launchProjectile(this.machine.scene);
	}

	tick() {
	}

	exit() {
		this.machine.loaded?.turn?.end();
		this.reset()
	}

	reset(): void {
	}
}