import { IState } from './IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
// @ts-ignore
import { ExecuteCodeAction, ActionManager, IAction, MeshBuilder } from '@babylonjs/core'

export class TurnEndState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() : Array<IAction> {
		this.reset()

		// Setup
		this.machine.guiHelper?.notifications.add(`Player ${this.machine.players[0].name} ends their turn`);
		const box_x = new MeshBuilder.CreateBox("box_x", {width: 10, height: 0.01, depth: 0.01}, this.machine.scene);
		const box_y = new MeshBuilder.CreateBox("box_y", {width: 0.01, height: 10, depth: 0.01}, this.machine.scene);
		const position = this.machine.turn?.chosenWeapon?.getProjectileSpawnPos();
		box_x.position = position;
		box_y.position = position;

		// Actions
		const actions: Array<IAction> = [];

		// DEV TOOL skip to next state manually by pressing Space
		actions.push(new ExecuteCodeAction({
			trigger: ActionManager.OnKeyUpTrigger,
			parameter: " "
		}, () => {
			this.next = true;
		}));

		// Mock projectile shooting logic
		const worm = this.machine.turn?.chosenWorm;
		if (worm) {
			const pos = worm.mesh.position;
			this.machine.ground?.affectTerrain(pos.x, pos.y, 3);
		}
		return (actions);
	}

	tick() {
		if (this.next) {
			this.machine.sendStatePacket(GameState.GAME_END);
		}
	}

	exit() {
		this.machine.turn?.dispose();
		this.machine.turn = undefined;
		this.reset()
	}

	reset(): void {
		this.next = false;
	}
}