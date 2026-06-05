import { Scene, Vector3 } from "@babylonjs/core";
import { keyInfo, MovementState } from "./MovementState";
import { Worm } from "../../player/Worm";
import { Achievements } from "../../data/achievments";
import { GameState } from "@/shared/state/GameState";

function forChosenWorm(
	isMovementState: boolean,
	worm: Worm,
	achievements: Achievements,
	keyStatus: keyInfo
) {
	const now = Date.now();
	worm.canJump = now >= worm.jumpTimer;

	if (!worm.onGround)
		return ; 

	if (worm.canJump && keyStatus.w)
		worm.jump(-0.65, 6, now);
	else if (worm.canJump && keyStatus.e)
		worm.jump(2.2, 3, now);
	else
	{
		if (keyStatus.a)
			worm.move(-1, (3 * Math.PI) / 2);
		else if (keyStatus.d)
			worm.move(1, Math.PI / 2);
		else
			worm.stop();

		if (isMovementState && (keyStatus.a || keyStatus.d)) {
			worm.pos.x = worm.collider.position.x
			const currentX = worm.pos.x;
			const delta = Math.abs(currentX - worm.previousPos.x);
			achievements.addToDistance(delta);
			worm.previousPos.x = currentX;
		}

		const currentVel = worm.aggregate.body.getLinearVelocity();
		worm.aggregate.body.setLinearVelocity
		(
			new Vector3
			(
				(worm.dirX * worm.playerSpeed) * worm.isMoving, 
				currentVel.y,
				0
			)
		);
	}

}

function forAllWorms(worm: Worm, scene: Scene) {
	// Create Vectors for ray cast
	const rayStart = worm.collider.getAbsolutePosition();
	const rayEnd = rayStart.add(new Vector3(0, -1.3, 0));
	const rayRes = (scene.getPhysicsEngine()!).raycast(rayStart, rayEnd);

	// Check with raycast if worm on ground
	if (rayRes.hasHit){
		worm.onGround = true;
		worm.airAnim?.stop();
	}
	else{
		worm.onGround = false;
		worm.canJump = false;
		// This does not work, and idk why but people are impatient and want this merged
        if (!worm.idleAnim?.isPlaying)
			worm.idleAnim?.stop();
        if (!worm.walkAnim?.isPlaying)
			worm.walkAnim?.stop();
        if (!worm.airAnim?.isPlaying)
            worm.airAnim?.start(true, 1, worm.airAnim.from, worm.airAnim.to, false);
	}

	// Remove gravity if on ground
	if (worm.onGround)
	{
		// console.log("My Gravity is 0!");
		worm.aggregate.body.setGravityFactor(0);
	}
	else
	{
		// console.log("My Gravity is 1!");
		worm.aggregate.body.setGravityFactor(1);
	}
}

export function movementTick(state: MovementState) {
	const machine = state.machine
	if (!machine.loaded || machine.loaded.players.length == 0)
		return ;

	machine.loaded.players.forEach((player) => {
		player.worms.forEach((worm) => {
			forAllWorms(worm, machine.scene)
		})
	})
	forChosenWorm(
		(state.machine.state == GameState.MOVEMENT),
		machine.loaded.turn.chosenWorm, 
		machine.achievements, 
		state.keyStatus
	);
}