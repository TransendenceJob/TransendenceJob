import { SC_TurnEnds, SC_Type } from '@/shared/packets/ServerClientPackets';
import { IState } from '../IState'
import { StateMachine } from '../StateMachine';
import { IAction, Vector3 } from '@babylonjs/core'
import { CS_ClientFinishedTurn, CS_Type } from '@/shared/packets/ClientServerPackets';

/**
 * Uses Notification system to display custom message based on if this client is active
 */
function turnMessage(machine: StateMachine) {
	if (machine.isActiveUser()) {
		machine.guiHelper?.notifications.add("Your Turn ends");
	}
	else {
		machine.guiHelper?.notifications.add(`${machine.getActiveUser().name} ends their turn`);
	}
}

export class TurnEndState implements IState {
	constructor(private machine: StateMachine) {
	}

	enter() {
		this.reset()
		console.log("Entered Turn End State");

		// Setup
		turnMessage(this.machine);

		// Actions
	}

	tick() {
		if (!this.machine.endOfTurnData || !this.machine.loaded) 
			return ;
		console.log("Handling data", this.machine.endOfTurnData)

		// Broken and abandoned particle system
		/*
		this.machine.endOfTurnData?.explo.forEach((explosion) => {
			this.machine.explosionEffect.start(new Vector3(explosion.position.x, explosion.position.y, explosion.radius));
			this.machine.loaded?.ground.affectTerrain(explosion.position.x, explosion.position.y, explosion.radius);
		})
		*/
		/*
		this.machine.endOfTurnData?.explo.forEach((explosion) => {
			this.machine.loaded?.ground.affectTerrain(explosion.position.x, explosion.position.y, explosion.radius);
		})
		*/

		this.machine.loaded.players = this.machine.loaded.players.filter((player) => {
			if (!this.machine.loaded)
				return ;
			const dataPlayer = this.machine.endOfTurnData?.players.find((p) => p.id == player.id);
			
			// If player is dead
			if (!dataPlayer) {
				player.dispose();
				return (false);
			};

			player.worms = player.worms.filter(worm => {
				const dataWorm = dataPlayer.worms.find((w) => w.id == worm.id);
				
				if (!dataWorm) {
					worm.dispose();
					return (false);
				}
				
				worm.gui.health = dataWorm.health;
				worm.collider.position.x = dataWorm.pos.x;
				worm.collider.position.y = dataWorm.pos.y;
				return (true);
			});
			return (true);
		})
		this.machine.endOfTurnData = undefined;
		// We cannot keep the chosen Worm reference a potentially dead player, so pick any other, if possible
		if (this.machine.loaded.players.length == 0 || this.machine.loaded.players[0].worms.length == 0) 
			this.machine.gameOver = false;
		else
			this.machine.loaded.turn.chosenWorm = this.machine.loaded.players[0].worms[0];
		this.machine.loaded.turn.chosenWeapon?.show(false);
		this.machine.msgToServer<CS_ClientFinishedTurn>(CS_Type.CS_ClientFinishedTurn, {});
	}

	exit() {
		this.machine.explosionEffect.stop();
		this.machine.loaded?.turn?.end();
		this.reset()
	}

	reset(): void {
	}
}