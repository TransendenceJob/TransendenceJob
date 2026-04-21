import { GameState } from '../../../shared/state/GameState';
import { ExecuteCodeAction, IAction, Scene } from '@babylonjs/core';
import { fadeAnimation } from '../fadeAnimation';

export class StateMachine {
	public state: GameState;
	private lastAction: Array<IAction>;
	private scene: Scene;
	constructor(scene: Scene) {
		this.state = GameState.GAME_PENDING;
		this.scene = scene;
		this.lastAction = [];
		this.init_game_pending();
	}

	registerNewActions(actions: Array<ExecuteCodeAction>) {
		while (this.lastAction.length > 0 ) {
			this.scene.unregisterAction(this.lastAction.pop());
		}
		while (actions.length > 0) {
			this.scene.registerAction(actions.pop());
		}
	}

	setState(newState: number) {
		const state: GameState = newState as GameState;
		console.log(`Old state: ${this.state} New State: ${state}`);
		if (this.state == state) {
			console.log("Setting to same state, no effects triggered");
			return ;
		}
		switch (state) {
			case GameState.GAME_PENDING: {
				this.init_game_pending();
				break ;
			}
			case GameState.GAME_START: {
				this.init_game_start();
				break ;
			}
			case GameState.ROUND_START: {
				this.init_round_start();
				break ;
			}
			case GameState.TURN_START: {
				this.init_turn_start();
				break ;
			}
			case GameState.PICK_WORM: {
				this.init_pick_worm();
				break ;
			}
			case GameState.MOVEMENT: {
				this.init_movement();
				break ;
			}
			case GameState.AIMING: {
				this.init_aiming();
				break ;
			}
			case GameState.TURN_END: {
				this.init_turn_end();
				break ;
			}
			case GameState.GAME_END: {
				this.init_game_end();
				break ;
			}
		}
		this.state = state;
	}

	init_game_pending() {
		console.log('Game pending');
		this.registerNewActions([])
	}

	init_game_start() {
		fadeAnimation(this.scene, true);
		console.log('BABYLON: State: Game starts');
	}

	init_round_start() {
		console.log('BABYLON: State: Round starts');
	}
	init_turn_start() {
		console.log('BABYLON: State: Turn starts');
	}

	init_pick_worm() {
		console.log('BABYLON: State: Picking Worm');
	}

	init_movement() {
		console.log('BABYLON: State: Moving Worm');
	}

	init_aiming() {
		console.log('BABYLON: State: Aiming Weapon');
	}

	init_turn_end() {
		console.log('BABYLON: State: Turn ends');
	}

	init_game_end() {
		console.log('BABYLON: State: Game Ends');
	}
}