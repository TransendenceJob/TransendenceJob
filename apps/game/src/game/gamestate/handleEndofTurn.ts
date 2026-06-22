import {
  explosionData,
  playerData,
  endOfTurnData,
  wormData,
} from '@/shared/packets/util';
import { Game } from '../Game';
import { Vector2 } from '@babylonjs/core';
import { Worm } from './Worm';
import { Player } from './Player';

/**
 * Generates data for packets based on Servers Worms
 * @param worms Worms to convert
 * @returns Array of wormData
 */
function generateWormData(worms: Array<Worm>): Array<wormData> {
  const result: Array<wormData> = [];
  worms.forEach((worm) => {
    // Round up, so there dont appear any worms with 1 health
    let health = Math.round(worm.health);
    if (health == 0 && worm.health > 0) health = 1;
    result.push({
      id: worm.id,
      pos: {
        x: worm.mesh.position.x,
        y: worm.mesh.position.y,
      },
      health: health,
    });
  });
  return result;
}

/**
 * Generates packet data to represent our active players
 * @param src
 * @returns
 */
function generatePlayerData(src: Array<Player>): Array<playerData> {
  const data: Array<playerData> = [];
  src.forEach((player) => {
    data.push({
      id: player.id,
      slot: player.slot,
      name: player.name,
      worms: generateWormData(player.worms),
    });
  });
  return data;
}

/**
 * Generates random death message with name
 * @param name Name of the worm to die
 * @returns message
 * Credit to https://www.babbel.com/en/magazine/death-euphemisms
 */
function randomDeathMsg(name: string) {
  const messages = [
    `${name} bit the dust`,
    `${name} passed on to the great beyond`,
    `${name} was laid to rest`,
    `${name} departed`,
    `Poor ${name} is no longer with us`,
    `${name} went to a better place`,
    `${name} crossed over`,
    `${name} was annihilated`,
    `${name} kicked the bucket`,
    `${name} bit the dust`,
    `${name} is pushing up daisis`,
    `${name} is now sleeping with the fishies`,
    `Goodbye, ${name}, you will be missed`,
    `${name} expired`,
    `${name} ceased`,
    `${name} slipped away`,
    `${name} lost their life`,
    `${name} left this life`,
    `${name} entered eternal rest`,
    `${name} was called home`,
    `${name} joined their ancestors`,
    `${name} passed beyond the veil`,
    `${name} is in a better place now `,
  ];
  const random = Math.round(Math.random() * messages.length);
  return messages[random - 1];
}

/**
 * Performs damaging operations on worms, handles killing worms
 * @param explo data for the explosion currently being handled
 * @param worms The worms to damage
 * @param deathMsgs Array to write messages to for players and worms that died
 * @returns Array of strings with messages that each person has
 */
function damageWorms(
  explo: explosionData,
  worms: Array<Worm>,
  deathMsgs: Array<string>,
) {
  const explosionVector = new Vector2(explo.position.x, explo.position.y);
  worms.forEach((worm) => {
    // Calculate damage
    const distanceToExplosion = Vector2.Distance(
      explosionVector,
      worm.mesh.position,
    );
    console.log(
      `Worm ${worm.id} has a distance of ${distanceToExplosion} and ${explo.radius}`,
    );
    if (distanceToExplosion > explo.radius) return;
    console.log(
      'Is inside explosion, damage: ',
      explo.damage * (1 - distanceToExplosion / explo.radius),
    );
    worm.health -= explo.damage * (1 - distanceToExplosion / explo.radius);
    console.log('Worm ', worm.name, 'gets hit down to ', worm.health);

    // Kill Worms
    if (worm.health > 0) return;
    const index = worms.findIndex((findWorm) => findWorm.id == worm.id);
    if (index >= 0) {
      deathMsgs.push(randomDeathMsg(worms[index].name));
      worms[index].dispose();
      worms.splice(index, 1);
    }
  });
}

/**
 * Handles applying 1 explosion on all players and their worms
 * @param explo data for the explosion currently being handled
 * @param game Game that holds players
 * @param deathMsgs Array of death messages
 * @param deadPlayerIds Array of ids for players that die this turn
 */
function damagerPlayers(
  explo: explosionData,
  game: Game,
  deathMsgs: Array<string>,
  deadPlayerIds: Array<string>,
) {
  game.players.forEach((player: Player) => {
    // Damage the worms of this player
    damageWorms(explo, player.worms, deathMsgs);

    // Find dead Player
    if (player.worms.length > 0) return;
    const index = game.players.findIndex(
      (findPlayer) => findPlayer.id == player.id,
    );
    if (index <= -1) return;

    // Kill Player
    deadPlayerIds.push(player.id);
    deathMsgs.push(randomDeathMsg(game.players[index].name));
    game.players[index].dispose();
    game.players.splice(index, 1);
  });
}

/**
 * Handles explosions happening, player deaths and worm deaths
 * Sends a packet if the game is over
 * @param explo Array of explosions to handle
 * @param game Game that holds players to damage
 * @returns
 */
export function handleEndofTurn(
  explo: Array<explosionData>,
  game: Game,
): endOfTurnData {
  const deathMsgs: Array<string> = [];
  const deadPlayerIds: Array<string> = [];
  let gameOver: boolean = false;
  explo.forEach((explosion) => {
    // Damage the players
    console.log(
      'Handling Explosion at ',
      explosion.position.x,
      explosion.position.y,
    );
    damagerPlayers(explosion, game, deathMsgs, deadPlayerIds);
  });

  // Handle Game being over
  let winners: Array<string> = [];
  if (game.players.length == 1) {
    winners = [game.players[0].id];
    gameOver = true;
  } else if (game.players.length == 0) {
    winners = deadPlayerIds;
    gameOver = true;
  }
  return {
    players: generatePlayerData(game.players),
    gameOver: gameOver,
    deathMsgs: deathMsgs,
    winners: winners,
    explo: explo,
  };
}
