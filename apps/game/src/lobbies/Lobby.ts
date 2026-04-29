import { NullEngine } from 'babylonjs';
import {
  CS_Type,
  CS_GenericPacket,
} from '@/shared/packets/ClientServerPackets';
import {
  SC_Type,
  SC_Base,
  SC_GenericStatePacket,
  SC_DEV_ButtonPress,
  SC_DEV_GameState,
} from '@/shared/packets/ServerClientPackets';
import { gameData } from '@/shared/packets/util';
import { SeqHandler } from './SeqHandler';
import { Game } from '../game/Game';
import { MessageQueue } from './MessageQueue';
import { GameState } from '@/shared/state/GameState';

enum LobbyStateEnum {
  ClosedLobby = 0,
  OpenLobby = 1,
  Loading = 2,
  Game = 3,
  EndScreen = 4,
}

/**
 * Translates Lobby State Enum to corresponding packet type,
 * to put Client into the corresponding state
 * @param state Lobbys State
 * @returns enum/string for Json packet type
 */
function translateLobbyState(
  state: LobbyStateEnum,
): SC_GenericStatePacket['type'] {
  switch (state) {
    case LobbyStateEnum.OpenLobby:
      return SC_Type.SC_StartLobby;
    case LobbyStateEnum.Loading:
      return SC_Type.SC_StartLoading;
    case LobbyStateEnum.Game:
      return SC_Type.SC_StartGame;
    case LobbyStateEnum.EndScreen:
      return SC_Type.SC_GameFinished;
  }
  return SC_Type.SC_InvalidState;
}

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
  public state: LobbyStateEnum;
  public id: number;
  private engine: NullEngine;
  private msgToClient: (msg: string) => void;
  private seqHandler: SeqHandler;
  private game: Game | undefined;
  private queue: MessageQueue;

  /**
   * On Lobby Creation, call the constructor,
   * which sets up the basic data and calls functions,
   * to register repeating events like rendernig, timeouts etc.
   * @param id unique number identifier for this lobby
   */
  constructor(id: number, emitData: (msg: string) => void) {
    this.state = LobbyStateEnum.OpenLobby;
    this.msgToClient = emitData;
    this.id = id;
    this.engine = new NullEngine();
    // Since we dont have functionality for sending packets to specific players, this feature is made to treat all players as 1
    this.seqHandler = new SeqHandler(1);
    this.seqHandler.registerPlayer(0, 0);
    this.game = undefined;
    this.queue = new MessageQueue();
    this.registerLoop();
  }

  /**
   * Register code that should be repeatedly executed
   */
  private registerLoop() {
    this.engine.runRenderLoop(() => {
      this.handlePackets();
      this.game?.tick();
      this.game?.scene.render();
    });
  }

  public sendGameStatePacket() {
    const response = this.createBasePacket<SC_DEV_GameState>(
      SC_Type.SC_DEV_GameState,
      {
        gameState: this.game ? this.game.get() : 0,
      },
    );
    this.msgToClient(JSON.stringify(response));
  }

  /**
   * @note Explanation of this Syntax:
   * The function has to be called with a data type T that has the fields from SC_Base
   * AND a type parameter with an enum value for type,
   * or it will throw a compile time error
   * We have 1 parameter, called type, whoose data type is the enum from the type field of the interface given to the template
   * Then we take the rest of the fields of the given interface, except for type,
   * and insert them into the created packet using the spread operator
   * We specify the function returns the specified interface type and return such an object
   */
  private createBasePacket<T extends SC_Base & { type: SC_Type }>(
    type: T['type'],
    data: Omit<T, keyof SC_Base | 'type'>,
  ): T {
    this.seqHandler.increase();
    return {
      type: type,
      lobbyId: this.id,
      seq: this.seqHandler.getSeq(0),
      ...data,
    } as T;
  }

  /**
   * @brief Called whenever clients send to websocket with "msgToServer"
   * @param data any Client->Server packet, holds the payload as object
   */
  msgToServer(data: CS_GenericPacket) {
    this.queue.write(data);
  }
  /*
  <T extends SC_Base & { type: SC_Type }>(
    type: T['type'],
    data: Omit<T, keyof SC_Base | 'type'>,
  ): T {
    const response = this.createBasePacket<T>(type, data);
    this.msgToClient(JSON.stringify(response));
  }
    */
  /**
   * Change state of Lobby, automatically tells Clients to change as well
   * @param newState New State to set Lobby to
   */
  private setState(newState: LobbyStateEnum) {
    if (this.state == newState) return;
    this.state = newState;
    const response = this.createBasePacket<SC_GenericStatePacket>(
      translateLobbyState(newState),
      {},
    );
    this.msgToClient(JSON.stringify(response));
    if (this.state == LobbyStateEnum.Game) {
      this.game?.setState(GameState.GAME_START);
    }
    if (newState != LobbyStateEnum.Game) {
      this.game?.dispose();
      this.game = undefined;
    }
    if (newState == LobbyStateEnum.Loading) {
      this.game = new Game(
        this.engine,
        () => {
          this.sendGameStatePacket();
        },
        // This is passing a newly made function that can send Server->Client packets
        <T extends SC_Base & { type: SC_Type }>(
          type: T['type'],
          data: Omit<T, keyof SC_Base | 'type'>,
        ) => {
          const response = this.createBasePacket<T>(type, data);
          this.msgToClient(JSON.stringify(response));
        },
      );
    }
  }

  dispose() {
    this.engine.dispose();
  }

  private handlePackets() {
    const packetList: Array<CS_GenericPacket> = this.queue.read();
    packetList.forEach((data: CS_GenericPacket) => {
      // Most of theese should be removed later,
      // only exists to move through game and lobby states as developer
      // Client wants to connect, so send them the current state to display
      switch (data.type) {
        case CS_Type.CS_ConnectAttempt: {
          const response: SC_GenericStatePacket = {
            type: translateLobbyState(this.state),
            lobbyId: this.id,
            seq: [0],
          };
          this.msgToClient(JSON.stringify(response));
          break;
        }

        // DEV mode, should be removed late, Client commands state to be set to Lobby
        case CS_Type.CS_DEV_StartLobby: {
          this.setState(LobbyStateEnum.OpenLobby);
          break;
        }

        // DEV mode, should be removed late, Client commands state to be set to Loading
        case CS_Type.CS_DEV_StartLoading: {
          this.setState(LobbyStateEnum.Loading);
          break;
        }

        // DEV mode, should be removed late, Client commands state to be set to Game
        case CS_Type.CS_DEV_StartGame: {
          this.setState(LobbyStateEnum.Game);
          break;
        }

        // DEV mode, should be removed late, Client commands state to be set to Lobby after game ends
        case CS_Type.CS_DEV_StartEndscreen: {
          this.setState(LobbyStateEnum.OpenLobby);
          break;
        }

        // For the button to send to Server, just send back a copy
        case CS_Type.CS_DEV_ButtonPress: {
          const response = this.createBasePacket<SC_DEV_ButtonPress>(
            SC_Type.SC_DEV_ButtonPress,
            {
              timestamp: data.timestamp,
              msg: data.message,
            },
          );
          this.msgToClient(JSON.stringify(response));
          break;
        }

        // For switching game state
        case CS_Type.CS_DEV_SetGameState: {
          if (!this.game) return;
          this.game.setState(data.state);
          break;
        }

        // For getting game state
        case CS_Type.CS_GetGameState: {
          this.sendGameStatePacket();
          break;
        }

        default: {
          console.log(
            `Error: Server received packet with unhandled type: ${JSON.stringify(data)}`,
          );
        }
      }
    });
  }
}
