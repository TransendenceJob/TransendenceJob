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
import { IState } from './IState';
import { GameStartState } from './GameStartState';
import { RoundStartState } from './RoundStartState';
import { TurnStartState } from './TurnStartState';
import { PickWormState } from './PickWormState';
import { MovementState } from './MovementState';
import { AimingState } from './AimingState';
import { TurnEndState } from './TurnEndState';
import { GameEndState } from './GameEndState';
import { GamePendingState } from './GamePendingState';

export class StateMachine {
	public scene: Scene;
	public canvas: HTMLCanvasElement;
	public msgToServer: msgToServerType;
	public state: GameState;
	public currentState: IState | null = null;
	public states: Map<GameState, IState> = new Map();
	private lastAction: Array<IAction>;
	public players: Array<Player>
	public guiHelper: GuiHelper | undefined;
	public ground: Ground | undefined;
	constructor(canvas: HTMLCanvasElement, scene: Scene, msgToServer: msgToServerType) {
		this.canvas = canvas;
		this.scene = scene;
		this.msgToServer = msgToServer;
		this.state = GameState.GAME_PENDING;
		this.states.set(GameState.GAME_PENDING, new GamePendingState(this));
		this.states.set(GameState.GAME_START, new GameStartState(this));
		this.states.set(GameState.ROUND_START, new RoundStartState(this));
		this.states.set(GameState.TURN_START, new TurnStartState(this));
		this.states.set(GameState.PICK_WORM, new PickWormState(this));
		this.states.set(GameState.MOVEMENT, new MovementState(this));
		this.states.set(GameState.AIMING, new AimingState(this));
		this.states.set(GameState.TURN_END, new TurnEndState(this));
		this.states.set(GameState.GameEndState, new GameEndState(this));
		this.scene.onBeforeRenderObservable.add(() => {
			this.currentState?.tick?.();
		})
		this.lastAction = [];
		this.players = [];
		this.guiHelper = undefined;
		this.ground = undefined;
		this.init_game_pending();
	}

	registerNewActions(actions: Array<IAction>) {
		// Clear old actions
		if (!this.scene.actionManager) {
			this.scene.actionManager = new ActionManager(this.scene);
		}
		this.scene.actionManager.actions = [];

		// Register new ones
		actions.forEach(action => this.scene.actionManager.registerAction(action));
	}

	setState(state: GameState) {
		console.log(`Old state: ${this.state} New State: ${state}`);
		if (this.state == state) {
			console.log("Setting to same state, no effects triggered");
			return ;
		}
		this.currentState?.exit();
		this.state = state;
		this.currentState = this.states.get(state) || null;
		this.currentState?.enter();
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