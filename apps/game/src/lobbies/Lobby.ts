import '@babylonjs/loaders/glTF';
import * as BABYLON from 'babylonjs';

enum LobbyStateEnum {
  ClosedLobby = 0,
  OpenLobby = 1,
  Loading = 2,
  Game = 3,
}

interface JsonPacket {
  type: string,
  timestamp: number,
  message: string,
}

/**
 * Translates Lobby State Enum to corresponding packet type,
 * to put Client into the corresponding state
 * @param state Lobbys State
 * @returns string for Json packet type
 */
function translateLobbyState(state: LobbyStateEnum): string
{
  switch (state) {
    case LobbyStateEnum.OpenLobby:
      return ("sc.DEV.start.lobby");
    case LobbyStateEnum.Loading:
      return ("sc.start.loading");
    case LobbyStateEnum.Game:
      return ("sc.start.game");
  }
  return ("sc.invalid.state");
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
  public lobbyId: number;
  private engine: BABYLON.NullEngine;
  private scene: BABYLON.Scene;
  private camera: BABYLON.ArcRotateCamera;
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
    this.lobbyId = id;
    this.engine = new BABYLON.NullEngine();
    this.scene = new BABYLON.Scene(this.engine);
    this.camera = new BABYLON.ArcRotateCamera(
      'Camera',
      0,
      0.8,
      100,
      BABYLON.Vector3.Zero(),
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
    if (
      this.state == LobbyStateEnum.Game &&
      Date.now() > this.lastTimestamp
    ) {
      this.msgToClient('{"type": "sc.DEV.repeat", "msg": "5 Seconds have passed"}');
      this.lastTimestamp = Date.now() + 5000;
    }
  }

  /**
   * @brief Called whenever clients send to websocket with "msgToServer"
   * @param raw_data string in json format sent on the socket
   */
  msgToServer(raw_data: string) {
    const data: JsonPacket = JSON.parse(raw_data);
    let response: JsonPacket = {type: "", timestamp: 0, message: ""};

    // Most of theese should be removed later, 
    // only exists to move through game and lobby states as developer

    // Client wants to connect, so send them the current state to display
    if (data.type == "cs.connection.attempt") {
      response.type = translateLobbyState(this.state);
    }
    // DEV mode, should be removed late, Client commands state to be set to Lobby
    else if (data.type == "cs.DEV.start.lobby") {
      response.type = "sc.DEV.start.lobby"
      this.state = LobbyStateEnum.OpenLobby;
    }
    // DEV mode, should be removed late, Client commands state to be set to Loading
    else if (data.type == "cs.DEV.start.loading") {
      response.type = "sc.start.loading";
      this.state = LobbyStateEnum.Loading;
    }
    // DEV mode, should be removed late, Client commands state to be set to Game
    else if (data.type == "cs.DEV.start.game") {
      response.type = "sc.start.game";
      this.state = LobbyStateEnum.Game;
    }
    // DEV mode, should be removed late, Client commands state to be set to Lobby after game ends
    else if (data.type == "cs.DEV.start.endscreen") {
      response.type = "sc.game.finished";
      this.state = LobbyStateEnum.OpenLobby;
    }
    // For the button to send to Server, just send back a copy
    else if (data.type == 'cs.DEV.buttonPress') {
      response.type = "sc.DEV.buttonPress";
      response.timestamp = data.timestamp;
      response.message = data.message;
    }

    // If Response set, send it out
    if (response.type != "") {
      this.msgToClient(JSON.stringify(response));
    }
  }
}
