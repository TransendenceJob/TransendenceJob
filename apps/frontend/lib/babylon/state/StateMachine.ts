import { IAction, Scene, ActionManager } from '@babylonjs/core';
import { GameState } from '@/shared/state/GameState';
import { CS_DEV_SetGameState, CS_RequestChangeGameState, CS_Type } from '@/shared/packets/ClientServerPackets';
import { gameData } from '@/shared/packets/util';
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

export class StateMachine {
	public userId: string;
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
	public weapons: Array<IWeapon>;
	public activePlayerId: string;
	public turn: Turn | undefined;
	private initialized: boolean = false;

	constructor(canvas: HTMLCanvasElement, scene: Scene, msgToServer: msgToServerType, userId: string, log: (data: string) => void) {
		// Created once, on Object creation, persist until the end of the canvas
		this.userId = userId;
		this.scene = scene;
		this.canvas = canvas;
		this.msgToServer = msgToServer
		this.log = log;
		this.states.set(GameState.GAME_PENDING, new GamePendingState(this));
		this.states.set(GameState.GAME_LOADING, new GameLoadingState(this));
		this.states.set(GameState.GAME_START, new GameStartState(this));
		this.states.set(GameState.ROUND_START, new RoundStartState(this));
		this.states.set(GameState.TURN_START, new TurnStartState(this));
		this.states.set(GameState.PICK_WORM, new PickWormState(this));
		this.states.set(GameState.MOVEMENT, new MovementState(this));
		this.states.set(GameState.AIMING, new AimingState(this));
		this.states.set(GameState.TURN_END, new TurnEndState(this));
		this.states.set(GameState.GAME_END, new GameEndState(this));

		// Set when game starts proper
		
		// Set on Loading
		this.weapons = [];
		this.players = [];
		this.state = undefined;
		this.currentState = undefined;
		this.guiHelper = undefined;
		this.ground = undefined;
		this.activePlayerId = "";
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

	load(data: gameData) {
		loadGame(this, data);
	}
	
	/**
	 * Restart a new Game
	 */
	setupGame() {
		// Clear up remnants of old game
		this.clearGame();
		
		// Set up a fresh Game
		this.log("Setting up new Game");

		this.guiHelper = new GuiHelper(this.scene, this.canvas, this.msgToServer);
		// Need to prompt socket to update the UI if its connected
		this.queue?.updateSocketUi();
		//this.msgToServer<CS_GetGameState>(CS_Type.CS_GetGameState, {});
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
		if (this.guiHelper)
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
		this.weapons.forEach(w => w.dispose());
		this.weapons = [];
		this.players.forEach(p => p.dispose());
		this.players = [];
		this.turn?.dispose()
		this.turn = undefined;
		this.guiHelper?.dispose()
		this.guiHelper = undefined;
		this.ground?.dispose();
		this.ground = undefined;
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
		if (this.turn && this.turn.activePlayerId == this.userId) 
			return true;
		return false;
	}

	getActiveUser() {
		return (this.players.find((player) => player.id == this.activePlayerId) ?? this.players[0]);
	}

	dispose() {
		this.log("Clearing old Game")
		this.clearGame();
	}
}
