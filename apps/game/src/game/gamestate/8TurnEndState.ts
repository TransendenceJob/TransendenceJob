import { IState } from './IState';
import { Game } from '../Game';
import { GameState } from '@/shared/state/GameState';
import { endOfTurnData } from '@/shared/packets/util';
import { handleEndofTurn } from './handleEndofTurn';
import {
  SC_ExplosionOccurs,
  SC_TurnEnds,
  SC_Type,
  SC_WinningPlayer,
} from '@/shared/packets/ServerClientPackets';
import { LobbyStateEnum } from 'src/lobbies/lobbyUtil/LobbyStateEnum';

export class TurnEndState implements IState {
  private gameEnding: boolean;
  private timestamp: number;
  constructor(private game: Game) {
    this.gameEnding = false;
    this.timestamp = 0;
  }

  enter() {
    this.reset();

    // Setup
    console.log('End of Turn state begins');

    // Tell Clients to move to next state
    this.game.sendState();

    // Send out explosion show
    this.game.lobby.msgToClient<SC_ExplosionOccurs>(
      SC_Type.SC_ExplosionOccurs,
      {
        explo: this.game.aimingData.explosions,
      },
    );

    // Handle damage
    const result: endOfTurnData = handleEndofTurn(
      this.game.aimingData.explosions,
      this.game,
    );
    this.game.lobby.msgToClient<SC_TurnEnds>(SC_Type.SC_TurnEnds, {
      data: result,
    });
    if (result.gameOver) {
      this.game.lobby.msgToClient<SC_WinningPlayer>(SC_Type.SC_WinningPlayer, {
        winnerId: result.winners[0] ?? 0,
      });
      this.gameEnding = true;
      this.timestamp = Date.now();
    }
  }

  tick() {
    if (this.gameEnding) {
      if (Date.now() > this.timestamp + 500) {
        this.game.lobby.setState(LobbyStateEnum.EndScreen);
      }
      return;
    }

    // Check if all Players have reported finishing their turns
    let isClientTurnEnded = true;
    this.game.lobby.clientManager.clients.forEach((client) => {
      if (!client.finishedEndOfTurn) {
        isClientTurnEnded = false;
        return;
      }
    });
    if (isClientTurnEnded && Date.now() > this.timestamp + 500) {
      this.game.setState(GameState.TURN_START);
    }
  }

  exit() {
    this.reset();
    this.game.lobby.clientManager.clients.forEach((client) => {
      client.finishedEndOfTurn = false;
    });
  }

  reset(): void {}
}
