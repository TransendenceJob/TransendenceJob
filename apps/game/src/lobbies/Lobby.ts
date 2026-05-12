import { NullEngine } from 'babylonjs';
import { CS_GenericPacket } from '@/shared/packets/ClientServerPackets';
import {
  SC_Type,
  SC_Base,
  SC_GenericStatePacket,
  SC_DEV_GameState,
  SC_LobbyData,
} from '@/shared/packets/ServerClientPackets';
import { Client, makeClient, resetClient } from '@/shared/packets/Client';
import { GameState } from '@/shared/state/GameState';
import { Game } from '../game/Game';
import { SeqHandler } from './lobbyUtil/SeqHandler';
import { MessageQueue } from './lobbyUtil/MessageQueue';
import { LobbyStateEnum } from './lobbyUtil/LobbyStateEnum';
import { handlePackets } from './lobbyUtil/packets/handlePackets';
import { translateLobbyState } from './lobbyUtil/translateLobbyState';
import { log, logType } from './lobbyUtil/log';

/**
 * An Object representing one Lobby, which goes through different states,
 * as our game progresses
 * This serves the pages for the client,
 * as well as handling websocket packages
 * Use msgToClient() to send a json packet to the Client
 * msgToServer() will trigger when json packet sent to server
 * gameServerLoop() triggers events periodically
 */
export class Lobby {
  public id: number;
  public state: LobbyStateEnum;
  public clients: Array<Client>;
  private engine: NullEngine;
  private emitData: (msg: string) => void;
  private seqHandler: SeqHandler;
  public game: Game;
  public queue: MessageQueue;

  /**
   * On Lobby Creation, call the constructor,
   * which sets up the basic data and calls functions,
   * to register repeating events like rendernig, timeouts etc.
   * @param id unique number identifier for this lobby
   */
  constructor(id: number, emitData: (msg: string) => void) {
    this.id = id;
    this.state = LobbyStateEnum.OpenLobby;
    this.clients = [];
    this.emitData = emitData;
    this.engine = new NullEngine();
    // Since we dont have functionality for sending packets to specific players, this feature is made to treat all players as 1
    this.seqHandler = new SeqHandler(1);
    this.seqHandler.registerPlayer('unused', 0);
    // Set up game with functionality to send packets to Client
    this.game = new Game(
      this.engine,
      () => {
        this.sendGameStatePacket();
      },
      // Game needs reference to call Lobbies packet function
      (type, data) => this.msgToClient(type, data),
    );
    // Set up Queue for reading packets synced
    this.queue = new MessageQueue();

    // Register code to execute every frame
    this.engine.runRenderLoop(() => {
      handlePackets(this);
      this.game.tick();
      this.game.scene.render();
    });
    console.log(`Created Lobby with ${this.id}`);
  }

  /**
   * @brief This function is used to send packets to the Client in an automated way
   * @note Explanation of this Syntax:
   * The function has to be called with a data type T that has the fields from SC_Base
   * AND a type parameter with an enum value for type,
   * or it will throw a compile time error
   * We have 1 parameter, called type, whoose data type is the enum from the type field of the interface given to the template
   * Then we take the rest of the fields of the given interface, except for type,
   * and insert them into the created packet using the spread operator
   * We specify the function returns the specified interface type and return such an object
   */
  public msgToClient<T extends SC_Base & { type: SC_Type }>(
    type: T['type'],
    data: Omit<T, keyof SC_Base | 'type'>,
  ) {
    this.seqHandler.increase();
    const response = {
      type: type,
      lobbyId: this.id,
      seq: this.seqHandler.getSeq('unused'),
      ...data,
    };
    this.emitData(JSON.stringify(response));
  }

  /**
   * @brief Sends packet to Client, telling them in which state the game is
   */
  public sendGameStatePacket() {
    this.msgToClient<SC_DEV_GameState>(SC_Type.SC_DEV_GameState, {
      gameState: this.game.get(),
    });
  }

  /**
   * @brief Called whenever clients send to websocket with "msgToServer"
   * @param data any Client->Server packet, holds the payload as object
   */
  msgToServer(data: CS_GenericPacket) {
    this.queue.write(data);
  }

  /**
   * Change state of Lobby, automatically tells Clients to change as well
   * @param newState New State to set Lobby to
   */
  setState(newState: LobbyStateEnum) {
    //if (this.state == newState) return;
    this.state = newState;

    // Send Packet telling Client the new Lobby state to load
    this.msgToClient<SC_GenericStatePacket>(translateLobbyState(newState), {});

    // Reset Clients Loading progress and readiness
    this.clients.forEach((client) => {
      resetClient(client);
    });

    if (this.state == LobbyStateEnum.Loading) {
      this.game.setState(GameState.GAME_LOADING);
    }
    if (this.state == LobbyStateEnum.Game) {
      this.game.setState(GameState.GAME_START);
    }
    // When Game ends, restart with new Game
    if (this.state == LobbyStateEnum.EndScreen) {
      this.game.dispose();
      this.game = new Game(
        this.engine,
        () => {
          this.sendGameStatePacket();
        },
        // Game needs reference to call Lobbies packet function
        (type, data) => this.msgToClient(type, data),
      );
      this.state = LobbyStateEnum.OpenLobby;
      this.clients = [];
    }
  }
  
  /**
   * @brief Called by the LobbyManager when a user's websocket connection is lost
   * @param userId ID of the player who disconnected
   */
  public handleDisconnect(userId: string) {
    // Currently handle disconnection logic if we are currently in the lobby state but could also be used for game disconnects later on
    if (this.state === LobbyStateEnum.OpenLobby) {
      return ;
    }
    // Find player to disconnect
    const playerIndex = this.clients.findIndex(p => p.id === userId);
    if (playerIndex == -1) {
      return ;
    }
    // Remove the player from the lobby list
    this.clients.splice(playerIndex, 1);
    this.msgToClient<SC_LobbyData>(
      SC_Type.SC_LobbyData,
      {
        userId: userId,
        lobbyData: this.clients,
      },
    );
  }

  dispose() {
    this.engine.dispose();
  }
}
