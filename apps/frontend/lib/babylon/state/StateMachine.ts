import { ExecuteCodeAction, IAction, Scene, ActionManager } from '@babylonjs/core';
import { GameState } from '../../../shared/state/GameState';
import { fadeAnimation } from '../fadeAnimation';
import { spawnWorms } from '../worms/spawnWorms';
import { createPlayers, Player } from '../Player';
import { points } from '../data/vectorData';
import { colors } from '../data/gameData';
import createGui from '../createGui';
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

export class StateMachine {
	public scene: Scene;
	public canvas: HTMLCanvasElement;
	public msgToServer: msgToServerType;
	public queue: MessageQueue;
	public state: GameState;
	public currentState: IState | null = null;
	public states: Map<GameState, IState> = new Map();
	private lastAction: Array<IAction>;
	public players: Array<Player>
	public guiHelper: GuiHelper | undefined;
	public ground: Ground | undefined;

	constructor(canvas: HTMLCanvasElement, scene: Scene, msgToServer: msgToServerType, queue: MessageQueue) {
		this.canvas = canvas;
		this.scene = scene;
		this.msgToServer = msgToServer;
		this.queue = queue;
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
			this.handlePackets();
			this.currentState?.tick?.();
		})
		this.lastAction = [];
		this.players = [];
		this.guiHelper = undefined;
		this.ground = undefined;

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

	setupGame() {
		this.reset();
		this.players = createPlayers();
		spawnWorms(this.scene, this.players, colors);
		this.guiHelper = createGui(this.scene, this.canvas, this.msgToServer);
		this.ground = new Ground(this.scene, points);
		this.registerNewActions([])
	}

	handlePackets() {
		const packets = this.queue.read();
		if (packets.length == 0)
			return ;
		console.log("Read packets from queue: ", packets);
		packets.forEach((packet) => {
			handlePacket(packet, this);
		})
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