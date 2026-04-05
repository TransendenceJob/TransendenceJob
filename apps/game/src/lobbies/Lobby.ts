import { NullEngine, Scene, ArcRotateCamera, Vector3 } from 'babylonjs';
import { CS_Type, CS_GenericPacket } from 'shared/packets/ClientServerPackets';
import { SC_Type, SC_GenericStatePacket, SC_StartLobby, SC_StartLoading, SC_StartGame, SC_GameFinished, SC_DEV_ButtonPress, SC_DEV_Periodic } from 'shared/packets/ServerClientPackets';

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
function translateLobbyState(state: LobbyStateEnum): SC_GenericStatePacket['type'] {
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
  gameServerLoop() {
    if (this.state == LobbyStateEnum.Game && Date.now() > this.lastTimestamp) {
      const response: SC_DEV_Periodic = {
        type: SC_Type.SC_DEV_Periodic,
        lobbyId: this.id,
        msg: "5 Seconds have passed",
        seq: [0],
      }
      this.msgToClient(JSON.stringify(response));
      this.lastTimestamp = Date.now() + 5000;
    }
  }

  /**
   * @brief Called whenever clients send to websocket with "msgToServer"
   * @param raw_data string in json format sent on the socket
   */
  msgToServer(raw_data: string) {
    const data: CS_GenericPacket = JSON.parse(raw_data) as CS_GenericPacket;

    // Most of theese should be removed later,
    // only exists to move through game and lobby states as developer

    // Client wants to connect, so send them the current state to display
    if (data.type == CS_Type.CS_ConnectAttempt) {
      const response: SC_GenericStatePacket = { type: translateLobbyState(this.state), lobbyId: this.id, seq: [0] };
      this.msgToClient(JSON.stringify(response));
    }
    // DEV mode, should be removed late, Client commands state to be set to Lobby
    else if (data.type == CS_Type.CS_DEV_StartLobby) {
      const response: SC_StartLobby = { type: SC_Type.SC_StartLobby, lobbyId: this.id, seq: [0] };
      this.state = LobbyStateEnum.OpenLobby;
      this.msgToClient(JSON.stringify(response));
    }
    // DEV mode, should be removed late, Client commands state to be set to Loading
    else if (data.type == CS_Type.CS_DEV_StartLoading) {
      const response: SC_StartLoading = { type: SC_Type.SC_StartLoading, lobbyId: this.id, seq: [0]  };
      this.state = LobbyStateEnum.Loading;
      this.msgToClient(JSON.stringify(response));
    }
    // DEV mode, should be removed late, Client commands state to be set to Game
    else if (data.type == CS_Type.CS_DEV_StartGame) {
      const response: SC_StartGame = { type: SC_Type.SC_StartGame, lobbyId: this.id, seq: [0]  };
      this.state = LobbyStateEnum.Game;
      this.msgToClient(JSON.stringify(response));
    }
    // DEV mode, should be removed late, Client commands state to be set to Lobby after game ends
    else if (data.type == CS_Type.CS_DEV_StartEndscreen) {
      const response: SC_GameFinished = { type: SC_Type.SC_GameFinished, lobbyId: this.id, seq: [0]  };
      this.state = LobbyStateEnum.OpenLobby;
      this.msgToClient(JSON.stringify(response));
    }
    // For the button to send to Server, just send back a copy
    else if (data.type == CS_Type.CS_DEV_ButtonPress) {
      const response: SC_DEV_ButtonPress = {
        type: SC_Type.SC_DEV_ButtonPress,
        lobbyId: this.id,
        timestamp: data.timestamp,
        msg: data.message,
        seq: [0],
      };
      this.msgToClient(JSON.stringify(response));
    }
    else {
      console.log(`Error: Server received packet with unhandled type: ${data}`);
    }
  }
}
