import { Scene, Observer } from '@babylonjs/core';
import { GameState } from '@/shared/state/GameState';
import { CS_DEV_SetGameState, CS_RequestChangeGameState, CS_Type } from '@/shared/packets/ClientServerPackets';
import { endOfTurnData, gameData } from '@/shared/packets/util';
import { Player } from '../player/Player';
import { msgToServerType } from '@/lib/packets/msgToServerType';
import { Ground } from './1_loading/Ground';
import { GuiHelper } from '../gui/GuiHelper';
import { IState } from './IState';
import { GamePendingState }		from './0_game_pending/GamePendingState';
import { loadGame } from './1_loading/loadGame';
import { GameLoadingState }		from './1_loading/GameLoadingState';
import { GameStartState }		from './2_game_start/GameStartState';
import { RoundStartState }		from './3_round_start/RoundStartState';
import { TurnStartState }		from './4_turn_start/TurnStartState';
import { Turn } from './4_turn_start/Turn';
import { PickWormState }		from './5_pick_worm/PickWormState';
import { MovementState }		from './6_movement/MovementState';
import { AimingState }			from './7_aiming/AimingState';
import { IWeapon } from './7_aiming/weapons/IWeapon';
import { TurnEndState }			from './8_turn_end/TurnEndState';
import { GameEndState }			from './9_game_end/GameEndState';
import { MessageQueue } from '../MessageQueue';
import { handlePacket } from '@/lib/packets/handlePacket';
import { aimingMeshes } from './1_loading/loadGame';
import { Achievements } from '../data/achievments';
import { movementTick } from './6_movement/movementTick';
import { ExplosionParticles } from './8_turn_end/ExplosionParticles';

// Stores the part of the statemachine that are created in the loading step
export interface loaded {
	ground: Ground,
	weapons: Array<IWeapon>,
	players: Array<Player>,
	turn: Turn,
	aiming: aimingMeshes,
}

export class StateMachine {
	public userId: string;
	public scene: Scene;
	public canvas: HTMLCanvasElement;
	public msgToServer: msgToServerType;
	public log: (data: string) => void;
	public states: Map<GameState, IState> = new Map();
	private movementPhysics: undefined | Observer<Scene>;
	private movementStateRef: MovementState;
	public gameOver: boolean;
	public explosionEffect: ExplosionParticles;
	
	public endOfTurnData: endOfTurnData | undefined;
	public queue: MessageQueue | undefined;
	public guiHelper: GuiHelper | undefined;
	public loaded: loaded | undefined;
	public state: GameState | undefined;
	public currentState: IState | undefined;
	public activePlayerId: string;
	public achievements: Achievements;
	private initialized: boolean = false;

	constructor(canvas: HTMLCanvasElement, scene: Scene, msgToServer: msgToServerType, userId: string, log: (data: string) => void) {
		// Created once, on Object creation, persist until the end of the canvas
		this.userId = userId;
		this.scene = scene;
		this.canvas = canvas;
		this.msgToServer = msgToServer
		this.log = log;
		this.movementStateRef = new MovementState(this);
		this.states.set(GameState.GAME_PENDING, new GamePendingState(this));
		this.states.set(GameState.GAME_LOADING, new GameLoadingState(this));
		this.states.set(GameState.GAME_START, new GameStartState(this));
		this.states.set(GameState.ROUND_START, new RoundStartState(this));
		this.states.set(GameState.TURN_START, new TurnStartState(this));
		this.states.set(GameState.PICK_WORM, new PickWormState(this));
		this.states.set(GameState.MOVEMENT, this.movementStateRef);
		this.states.set(GameState.AIMING, new AimingState(this));
		this.states.set(GameState.TURN_END, new TurnEndState(this));
		this.states.set(GameState.GAME_END, new GameEndState(this));
		this.gameOver = false;
		this.explosionEffect = new ExplosionParticles(scene);
		this.movementPhysics = undefined;

		// Set when game starts proper
		
		// Set on Loading
		this.endOfTurnData = undefined;
		this.state = undefined;
		this.currentState = undefined;
		this.guiHelper = undefined;
		this.loaded = undefined;
		this.activePlayerId = "";
		this.achievements = new Achievements();
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
		this.movementPhysics = this.scene.onBeforePhysicsObservable.add(()=> {
			movementTick(this.movementStateRef);
		})
	}

	/**
	 * Called to move the Games state to a different one
	 * If state is same as current one, does nothing
	 * @param state new state to set it to 
	 */
	setState(state: GameState) {
		// Exit Old State
		this.log(`Old state: ${this.state} New State: ${state}`);
		if (this.state == state) {
			this.log("Setting to same state, no effects triggered");
			return ;
		}
		this.currentState?.exit();

		// Delete Actions from old state
		this.scene.actionManager.actions = [];

		// Enter new State
		this.state = state;
		let newState: IState | undefined = this.states.get(state)
		if (newState)
			this.currentState = newState;
		else
			newState = new GamePendingState(this);
		this.currentState?.enter();

		// Register Actions that always need to exist
		if (this.guiHelper)
			this.scene.actionManager.registerAction(this.guiHelper?.notifications.action)
	}

	load(data: gameData) {
		loadGame(this, data);
	}
	
	/**
	 * Restart a new Game
	 */
	setupGame() {
		// Clear up remnants of old game
		this.clearGame();
		this.gameOver = false;
		
		// Set up a fresh Game
		this.log("Setting up new Game");

		this.guiHelper = new GuiHelper(this.scene, this.canvas, this.userId, this.msgToServer);
		// Need to prompt socket to update the UI if its connected
		this.queue?.updateSocketUi();
		//this.msgToServer<CS_GetGameState>(CS_Type.CS_GetGameState, {});
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
		this.gameOver = true;
		if (this.loaded) {
			this.loaded.weapons.forEach(w => w.dispose());
			this.loaded.players.forEach(p => p.dispose());
			this.loaded.turn.dispose();
			this.loaded.ground.dispose();
			this.loaded.aiming.target.dispose();
			this.loaded.aiming.plane.dispose();
			this.loaded.aiming.direction.dispose();
			this.loaded.aiming.tail.dispose();
		}
		if (this.movementPhysics)
			this.scene.onBeforeRenderObservable.remove(this.movementPhysics);
		this.loaded = undefined;
		this.guiHelper?.dispose()
		this.guiHelper = undefined;
	}

	/**
	 * Sends Request to server, to please change the state to something else
	 * @param state State to set it to
	 */
	sendRequestStatePacket(state: GameState) {
		this.msgToServer<CS_RequestChangeGameState>(CS_Type.CS_RequestChangeGameState, {state: state});
	}

	/**
	 * REMOVE THIS LATER! This only exists to help with development
	 * Forcefully changes server to something else
	 * @param state State to set it to
	 */
	sendForceStatePacket(state: GameState) {
		this.msgToServer<CS_DEV_SetGameState>(CS_Type.CS_DEV_SetGameState, {state: state});
	}

	/**
	 * @returns bool wether current player is the active player this turn
	 */
	isActiveUser() : boolean {
		if (this.loaded && this.loaded.turn.activePlayerId == this.userId) 
			return true;
		return false;
	}

	getActiveUser() {
		if (!this.loaded)
			throw new Error("Cannot get active user, when game isnt loaded");
		return (this.loaded.players.find((player) => player.id == this.activePlayerId) ?? this.loaded.players[0]);
	}

	/**
	 * Displays a message on the HUD, but only if this is the active Client
	 * @param msg Message to display
	 */
	msgForActive(msg: string) {
		if (this.guiHelper == undefined || !this.isActiveUser())
			return ;
		this.guiHelper.notifications.add(msg);
	}

	dispose() {
		this.log("Clearing old Game")
		this.clearGame();
	}
}
