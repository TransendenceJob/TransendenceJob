import { IAction, Scene, ActionManager } from '@babylonjs/core';
import { GameState } from '../../../shared/state/GameState';
import { CS_DEV_SetGameState, CS_GetGameState, CS_Type } from '../../../shared/packets/ClientServerPackets';
import { spawnWorms } from '../worms/spawnWorms';
import { createPlayers, Player } from '../Player';
import { points } from '../data/vectorData';
import { colors } from '../data/gameData';
import { msgToServerType } from '@/lib/packets/msgToServerType';
import { Ground } from '../Ground';
import { GuiHelper } from '../GuiHelper';
import { IState } from './IState';
import { GamePendingState }		from './gamestate/0GamePendingState';
import { GameStartState }		from './gamestate/1GameStartState';
import { RoundStartState }		from './gamestate/2RoundStartState';
import { TurnStartState }		from './gamestate/3TurnStartState';
import { PickWormState }		from './gamestate/4PickWormState';
import { MovementState }		from './gamestate/5MovementState';
import { AimingState }			from './gamestate/6AimingState';
import { TurnEndState }			from './gamestate/7TurnEndState';
import { GameEndState }			from './gamestate/8GameEndState';
import { MessageQueue } from '../MessageQueue';
import { handlePacket } from '../handlePacket';
import { Turn } from './Turn';
import { Worm } from '../worms/Worm';

export class StateMachine {
	public scene: Scene;
	public canvas: HTMLCanvasElement;
	public msgToServer: msgToServerType;
	public log: (data: string) => void;
	public states: Map<GameState, IState> = new Map();
	
	public queue: MessageQueue | undefined;
	public guiHelper: GuiHelper | undefined;
	public ground: Ground | undefined;
	public state: GameState | undefined;
	public currentState: IState | undefined;
	public players: Array<Player>;
	public turn: Turn | undefined;
	private initialized: boolean = false;

	constructor(canvas: HTMLCanvasElement, scene: Scene, msgToServer: msgToServerType, log: (data: string) => void) {
		// Created once, on Object creation, persist until the end of the canvas
		this.scene = scene;
		this.canvas = canvas;
		this.msgToServer = msgToServer;
		this.log = log;
		this.states.set(GameState.GAME_PENDING, new GamePendingState(this));
		this.states.set(GameState.GAME_START, new GameStartState(this));
		this.states.set(GameState.ROUND_START, new RoundStartState(this));
		this.states.set(GameState.TURN_START, new TurnStartState(this));
		this.states.set(GameState.PICK_WORM, new PickWormState(this));
		this.states.set(GameState.MOVEMENT, new MovementState(this));
		this.states.set(GameState.AIMING, new AimingState(this));
		this.states.set(GameState.TURN_END, new TurnEndState(this));
		this.states.set(GameState.GAME_END, new GameEndState(this));
		// Set when game starts proper
		this.state = undefined;
		this.players = [];
		this.currentState = undefined;
		this.guiHelper = undefined;
		this.ground = undefined;
		this.turn = undefined;
	}

	// Called only once per canvas, when sockets have been set up
	init(queue: MessageQueue) {
		if (this.initialized)
			return;
		this.initialized = true;
		this.queue = queue;
		this.setState(GameState.GAME_PENDING);
		this.scene.onBeforeRenderObservable.add(() => {
			this.handlePackets();
			this.currentState?.tick?.();
		})
	}

	/**
	 * Called to move the Games state to a different one
	 * If state is same as current one, does nothing
	 * @param state new state to set it to 
	 */
	setState(state: GameState) {
		this.log(`Old state: ${this.state} New State: ${state}`);
		if (this.state == state) {
			this.log("Setting to same state, no effects triggered");
			return ;
		}
		this.currentState?.exit();
		this.state = state;
		let newState: IState | undefined = this.states.get(state)
		if (newState)
			this.currentState = newState;
		else
			newState = new GamePendingState(this);
		const actions = this.currentState?.enter();
		if (actions)
			this.registerNewActions(actions);
	}
	
	/**
	 * Restart a new Game
	 */
	setupGame() {
		// Clear up remnants of old game
		this.clearGame();
		
		// Set up a fresh Game
		this.log("Setting up new Game");
		
		// First create Player object, that turn can reference
		this.players = createPlayers();
		// Then populate players with Worms
		if (!spawnWorms(this.scene, this.players, colors))
			console.warn("Babylon: Error during Worm spawning");
		// Create turn (with first player as active player)
		this.turn = new Turn(this.players[0]);
		// Setup up interactions for worms
		this.players.forEach((player) => {
			player.initPickWorm((chosen: Worm) => {
				if (this.turn)
					this.turn.chosenWorm = chosen;
			})
		})
		this.guiHelper = new GuiHelper(this.scene, this.canvas, this.msgToServer);
		// Need to prompt socket to update the UI if its connected
		this.queue?.updateSocketUi();
		this.ground = new Ground(this.scene, points);
		this.msgToServer<CS_GetGameState>(CS_Type.CS_GetGameState, {});
	}

	/**
	 * Resets the actions that a scene has
	 * @param actions state-specific list of Actions to add to scene
	 */
	registerNewActions(actions: Array<IAction>) {
		// Clear old actions
		if (!this.scene.actionManager) {
			this.scene.actionManager = new ActionManager(this.scene);
		}
		this.scene.actionManager.actions = [];
		
		// Add actions that always need to exist
		this.scene.actionManager.registerAction(this.guiHelper?.notifications.action)

		// Register new ones
		if (!actions)
			return ;
		actions.forEach(action => this.scene.actionManager.registerAction(action));
	}

	/**
	 * Gets packets from queue and handles them in order, before tick is executed
	 */
	handlePackets() {
		if (!this.queue)
			return 
		const packets = this.queue.read();
		if (packets.length == 0)
			return ;
		packets.forEach((packet) => {
			handlePacket(packet, this);
		})
	}

	/**
	 * Deletes game-specific properties, keeps stuff that survives games
	 */
	clearGame() {
		// Clean Players and their worms
		this.players.forEach(p => p.dispose());
		this.players = [];
		this.turn?.dispose()
		this.turn = undefined;
		this.guiHelper?.dispose()
		this.guiHelper = undefined;
		this.ground?.dispose();
		this.ground = undefined;
	}

	sendStatePacket(state: GameState) {
		this.msgToServer<CS_DEV_SetGameState>(CS_Type.CS_DEV_SetGameState, {state: state});
	}

	dispose() {
		this.log("Clearing old Game")
		this.clearGame();
	}
}
