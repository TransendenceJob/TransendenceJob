import { NullEngine, Scene, ArcRotateCamera, Vector3 } from 'babylonjs';
import { CS_Type, CS_GenericPacket } from '@/packets/ClientServerPackets';
import {
  SC_Type,
  SC_Base,
  SC_GenericStatePacket,
  SC_StartLobby,
  SC_StartLoading,
  SC_StartGame,
  SC_GameFinished,
  SC_DEV_ButtonPress,
  SC_DEV_Periodic,
} from '@/packets/ServerClientPackets';
import { SeqHandler } from './SeqHandler';

enum LobbyStateEnum {
  ClosedLobby = 0,
  OpenLobby = 1,
  Loading = 2,
  Game = 3,
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
  private scene: Scene;
  private camera: ArcRotateCamera;
  private lastTimestamp: number;
  private msgToClient: (msg: string) => void;
  private seqHandler: SeqHandler;

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
    this.scene = new Scene(this.engine);
    this.camera = new ArcRotateCamera(
      'Camera',
      0,
      0.8,
      100,
      Vector3.Zero(),
      this.scene,
    );
    this.lastTimestamp = 0;
    // Since we dont have functionality for sending packets to specific players, this feature is made to treat all players as 1
    this.seqHandler = new SeqHandler(1);
    this.seqHandler.registerPlayer(0, 0);
    this.registerLoop();
  }

  /**
   * Register code that should be repeatedly executed
   */
  private registerLoop() {
    this.engine.runRenderLoop(() => {
      // Call the Babylon Renderer
      this.scene.render();

      // This is where we can register custom code
      this.gameServerLoop();
    });
  }

  /**
   * This is where we would put our code that should be run each frame (Interactions, Inputs, Timers etc.)
   * Currently has periodic output every 5 seconds
   */
  private gameServerLoop() {
    this.sendPeridoicPacket();
  }

  private sendPeridoicPacket() {
    if (this.state == LobbyStateEnum.Game && Date.now() > this.lastTimestamp) {
      const response = this.createBasePacket<SC_DEV_Periodic>(
        SC_Type.SC_DEV_Periodic,
        {
          msg: '5 Seconds have passed',
        },
      );
      this.msgToClient(JSON.stringify(response));
      this.lastTimestamp = Date.now() + 5000;
    }
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
        const response = this.createBasePacket<SC_StartLobby>(
          SC_Type.SC_StartLobby,
          {},
        );
        this.state = LobbyStateEnum.OpenLobby;
        this.msgToClient(JSON.stringify(response));
        break;
      }

      // DEV mode, should be removed late, Client commands state to be set to Loading
      case CS_Type.CS_DEV_StartLoading: {
        const response = this.createBasePacket<SC_StartLoading>(
          SC_Type.SC_StartLoading,
          {},
        );
        this.state = LobbyStateEnum.Loading;
        this.msgToClient(JSON.stringify(response));
        break;
      }

      // DEV mode, should be removed late, Client commands state to be set to Game
      case CS_Type.CS_DEV_StartGame: {
        const response = this.createBasePacket<SC_StartGame>(
          SC_Type.SC_StartGame,
          {},
        );
        this.state = LobbyStateEnum.Game;
        this.msgToClient(JSON.stringify(response));
        break;
      }

      // DEV mode, should be removed late, Client commands state to be set to Lobby after game ends
      case CS_Type.CS_DEV_StartEndscreen: {
        const response = this.createBasePacket<SC_GameFinished>(
          SC_Type.SC_GameFinished,
          {},
        );
        this.state = LobbyStateEnum.OpenLobby;
        this.msgToClient(JSON.stringify(response));
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

      default: {
        console.log(
          `Error: Server received packet with unhandled type: ${JSON.stringify(data)}`,
        );
      }
    }
  }
}
