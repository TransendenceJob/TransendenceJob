import '@babylonjs/loaders/glTF';
import * as BABYLON from 'babylonjs';
import * as fs from 'fs';
import type { Response } from 'express';

enum LobbyStateEnum {
  ClosedLobby = 0,
  OpenLobby = 1,
  Loading = 2,
  Game = 3,
}

/**
 * An Object representing one Lobby, which goes through different states,
 * as our game progresses
 * This serves the pages for the client,
 * as well as handling websocket packages
 * Use msgToClient() to send a json packet to the Client
 * msgToServer() will trigger when json packet sent to server
 * gameServerLoop() triggers events periodically
 * servePage() sets the Response to a web page based on current state
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
    this.state = LobbyStateEnum.ClosedLobby;
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
      this.state == LobbyStateEnum.ClosedLobby &&
      Date.now() > this.lastTimestamp
    ) {
      this.msgToClient('{"msg": "5 Seconds have passed"}');
      this.lastTimestamp = Date.now() + 5000;
    }
  }

  /**
   * @brief Called when Client requests webpage for Lobby, calls function to handle Request
   * Since we currently dont have the Frontend or Pages to move between states,
   * we simply skip to the next one whenever a file is requested
   */
  servePage(res: Response) {
    switch (this.state) {
      case LobbyStateEnum.ClosedLobby:
        this.state++;
        this.lobbyClosed(res);
        break;
      case LobbyStateEnum.OpenLobby:
        this.state++;
        this.lobbyOpen(res);
        break;
      case LobbyStateEnum.Loading:
        this.state++;
        this.lobbyloading(res);
        break;
      case LobbyStateEnum.Game:
        this.state = LobbyStateEnum.ClosedLobby;
        this.lobbyGame(res);
        break;
    }
  }

  /**
   * @brief Called to serve the Client an html message when joining lobby failed
   * @param res Response to be set to the file
   */
  lobbyClosed(res: Response) {
    res.send(`Lobby closed, id: ${this.id} (Reload to move to next state)`);
  }

  /**
   * @brief Called to serve the Client the NextJs Page for the Lobby
   * @param res Response to be set to the file
   */
  lobbyOpen(res: Response) {
    res.send('Lobby is open (Reload to move to next state)');
  }

  /**
   * @brief Called to serve the Client the NextJs Page for the Loading
   * @param res Response to be set to the file
   */
  lobbyloading(res: Response) {
    res.send('Lobby is loading (Reload to move to next state)');
  }

  /**
   * @brief Called to serve the Client the Babylon Canvas Page for active game
   * @param res Response to be set to the file
   */
  lobbyGame(res: Response) {
    const filePath: string = process.cwd() + '/static_game_files/raw.html';
    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        return res.sendFile(filePath);
      }
    } catch {
      console.log(`Failed to load game file, path: ${filePath}`);
      return res.status(404).send('File not found');
    }
  }

  /**
   * @brief Called whenever clients send to websocket with "msgToServer"
   * @param raw_data string in json format sent on the socket
   */
  msgToServer(raw_data: string) {
    const data: unknown = JSON.parse(raw_data);
    console.log('Lobby received message: ', data);
  }
}
