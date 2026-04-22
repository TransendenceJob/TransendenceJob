import { ExecuteCodeAction, IAction, Scene, ActionManager } from '@babylonjs/core';
import { GameState } from '../../../shared/state/GameState';
import { fadeAnimation } from '../fadeAnimation';
import { spawnWorms } from '../worms/spawnWorms';
import { createPlayers, Player } from '../Player';
import { points } from '../data/vectorData';
import { colors } from '../data/gameData';
import { guiHelperType } from '../guiHelperType';
import createGui from '../createGui';
import { msgToServerType } from '@/lib/packets/msgToServerType';
import { Ground } from '../Ground';
import { GuiHelper } from '../GuiHelper';

export class StateMachine {
	private scene: Scene;
	private canvas: HTMLCanvasElement;
	private msgToServer: msgToServerType;
	public state: GameState;
	private lastAction: Array<IAction>;
	private players: Array<Player>
	public guiHelper: GuiHelper | undefined;
	private ground: Ground | undefined;
	constructor(canvas: HTMLCanvasElement, scene: Scene, msgToServer: msgToServerType) {
		this.canvas = canvas;
		this.scene = scene;
		this.msgToServer = msgToServer;
		this.state = GameState.GAME_PENDING;
		this.lastAction = [];
		this.players = [];
		this.guiHelper = undefined;
		this.ground = undefined;
		this.init_game_pending();
	}

	registerNewActions(actions: Array<ExecuteCodeAction>) {
		// Clear old actions
		if (!this.scene.actionManager) {
			this.scene.actionManager = new ActionManager(this.scene);
		}
		this.scene.actionManager.actions = [];

		// Register new ones
		actions.forEach(action => this.scene.actionManager.registerAction(action));
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
		this.reset();
		console.log('Game pending');
		this.players = createPlayers();
		spawnWorms(this.scene, this.players, colors);
		this.guiHelper = createGui(this.scene, this.canvas, this.msgToServer);
		this.ground = new Ground(this.scene, points);
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
		this.reset();
	}

	reset() {
		// Clean Players and their worms
		for (let i = 0; i < this.players.length; i++)
			if (this.players[i])
				this.players[i].dispose();
		this.players = [];
		this.guiHelper?.dispose()
		this.guiHelper = undefined;
		this.ground = undefined;
	}
}