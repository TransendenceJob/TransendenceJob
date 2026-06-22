import { CS_DEV_StartEndscreen, CS_Type } from '@/shared/packets/ClientServerPackets';
import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { IAction } from '@babylonjs/core'

const WAIT_DURATION = 3000;

/**
 * @note This state is somewhat weird:
 * When the game ends, the enter is called regularly and all interactibility is taken from the player
 * However, then it keeps tick() ing regularly
 * When the Server says to go back to Pending State,
 * ONLY THEN will it call this exit() and then the enter() from pending state, which will clear and set up a new game
 */
export class GameEndState implements IState {
	private then: number;
	constructor(private machine: StateMachine) {
		this.then = 0;
	}

	enter() {
		this.reset()

		this.then = Date.now();

		// Setup
		this.machine.guiHelper?.notifications.add("Game Over");

	}

	tick() {
		if (this.then + WAIT_DURATION > Date.now()) {
			// After this was responded to, the game gets hidden again, and should
			this.machine.msgToServer<CS_DEV_StartEndscreen>(CS_Type.CS_DEV_StartEndscreen, {
				won: false,
				winnerId: "",
			});
		}
	}

	exit() {
		// !This is only called, when the server says to go back to loading a new game!
		this.reset()
		this.machine.clearGame();
	}

	reset(): void {
		this.then = 0;
	}
}