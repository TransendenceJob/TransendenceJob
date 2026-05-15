import { IState } from './IState'
import { StateMachine } from '../StateMachine';
import { GameState } from '@/shared/state/GameState';
import { ExecuteCodeAction, ActionManager, IAction, MeshBuilder } from '@babylonjs/core'

export class TurnEndState implements IState {
	private next: boolean = false;
	constructor(private machine: StateMachine) {}

	enter() : Array<IAction> {
		this.reset()

		// Setup
		this.machine.guiHelper?.notifications.add(`Player ${this.machine.players[0].name} ends their turn`);

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
			this.machine.sendForceStatePacket(GameState.GAME_END);
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