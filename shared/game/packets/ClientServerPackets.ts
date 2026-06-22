// import * from 'ClientServerPackets.ts';

import { aimStateId, explosionData, pointData } from "./util";


/**
 * ADDING A NEW PACKET
 * 1) Create an enum in the CS_Type table
 * 2) Create an interface based on the existing schema
 * 	1] Name should be CS_ and then CamelCase what its for
 * 	2] It should have a type parameter, which will be the enum from 1)
 * 	3] It should inherit from CS_Base
 * 3) Add the interface name into the union type at the end
 */


export enum CS_Type {
	CS_DEV_StartLobby =			"CS_DEV_StartLobby",
	CS_DEV_StartLoading =		"CS_DEV_StartLoading",
	CS_DEV_StartGame =			"CS_DEV_StartGame",
	CS_DEV_StartEndscreen =		"CS_DEV_StartEndscreen",
	CS_DEV_ButtonPress =		"CS_DEV_ButtonPress",
	CS_ConnectAttempt =			"CS_ConnectAttempt",
	CS_ReadyChange =			"CS_ReadyChange",
	CS_LoadingProgress =		"CS_LoadingProgress",
	CS_FinishedLoading =		"CS_FinishedLoading",
	CS_FailedLoading =			"CS_FailedLoading",
	CS_GetGameState =			"CS_GetGameState",
	CS_DEV_SetGameState =		"CS_DEV_SetGameState",
	CS_JoinLobby =				"CS_JoinLobby",
	CS_RequestChangeGameState =	"CS_RequestChangeGameState",
	CS_WormChosen =				"CS_WormChosen",
	CS_WeaponChosen =			"CS_WeaponChosen",
	CS_AimAngle =				"CS_AimAngle",
	CS_AimMoveTarget =			"CS_AimMoveTarget",
	CS_EndAimState =			"CS_EndAimState",
	CS_SwitchAimState =			"CS_SwitchAimState",
	CS_AimTargetAngle =			"CS_AimTargetAngle",
	CS_CancelAiming =			"CS_CancelAiming",
	CS_UpdateSettings = 		"CS_UpdateSettings",
	CS_DEV_GameWon =			"CS_DEV_GameWon",
	CS_DEV_StaleMate =			"CS_DEV_StaleMate",
	CS_WormPosition =			"CS_WormPosition",
	CS_ClientFinishedTurn =		"CS_ClientFinishedTurn",
	CS_IWIN =					"CS_IWIN",
}

// Packets that should definitely not show up in logging
// (likely because they are sent every tick)
export const hideClientPackets: Array<CS_Type> = [
	CS_Type.CS_AimAngle,
	CS_Type.CS_AimMoveTarget,
	CS_Type.CS_WormPosition,
]

/**
 * Fields used in ALL packets:
 * @param lobbyId identifying number for which lobby this packet is meant
 * @param userId identifies the client who sends this packet
 */
export interface CS_Base {
	lobbyId: number,
	userId: string,
}
// CONNECTING =================================================================

/**
 * Sent when a user wants to connect to a lobby
 */
export interface CS_ConnectAttempt extends CS_Base {
	type: CS_Type.CS_ConnectAttempt,
	socketId: string,
	name: string,
}

/**
 * Sent when a user wants to formally join the lobby slots
 * @param userId identifying number for a player
 */
export interface CS_JoinLobby extends CS_Base {
	type: CS_Type.CS_JoinLobby;
	userId: string;
	userName: string;
}

// LOBBY ======================================================================

/**
 * Sent when a user changes their readiness state
 * @param ready New state the user arrived at
 */
export interface CS_ReadyChange extends CS_Base {
	type: CS_Type.CS_ReadyChange,
	ready: boolean,
}

/**
 * DEV MODE, delete later
 */
export interface CS_DEV_StartLobby extends CS_Base {
	type: CS_Type.CS_DEV_StartLobby,
}

/**
 * Sent when a user changes the game settings in the lobby
 * @param maxWorms amount of worms spawning
 * @param map select map which we load
 */
export interface CS_UpdateSettings extends CS_Base {
	type: CS_Type.CS_UpdateSettings;
	maxWorms: number | undefined;
	map: string | undefined;
}

// LOADING ====================================================================

/**
 * Sent when a user gets past a certain loading threshold
 * @param percentage number from 0-100 how much they finished loading
 * @param msg optional accompanying message about which part they finished loading
 */
export interface CS_LoadingProgress extends CS_Base {
	type: CS_Type.CS_LoadingProgress,
	percentage: number,
	msg: string,
}

/**
 * Sent when a user finished loading
 */
export interface CS_FinishedLoading extends CS_Base {
	type: CS_Type.CS_FinishedLoading,
}

/**
 * Sent when a user failed loading
 * @param msg Reason why loading failed
 */
export interface CS_FailedLoading extends CS_Base {
	type: CS_Type.CS_FailedLoading,
	msg: string,
}

/**
 * DEV MODE, delete later
 */
export interface CS_DEV_StartLoading extends CS_Base {
	type: CS_Type.CS_DEV_StartLoading,
}

// GAME =======================================================================

export interface CS_RequestChangeGameState extends CS_Base {
	type: CS_Type.CS_RequestChangeGameState,
	state: number,
}

/**
 * DEV MODE, delete later
 * For pressing the example button in the scene
 * @param timestamp Timestamp of when press occured
 * @param message Message about button pressing
 */
export interface CS_DEV_ButtonPress extends CS_Base {
	type: CS_Type.CS_DEV_ButtonPress,
	timestamp: number,
	message: string,
}

/**
 * DEV MODE, delete later
 */
export interface CS_DEV_StartGame extends CS_Base {
	type: CS_Type.CS_DEV_StartGame,
}

/**
 * Sends Request to Server about which state the game is in
 * Sent when a Client initially loads the Babylon Canvas, when ui is being set up
 * @param state: number representing the curent state
 */
export interface CS_GetGameState extends CS_Base {
	type: CS_Type.CS_GetGameState,
}

/**
 * DELETE ME IM ONLY HERE FOR DEBUGGIN
 */
export interface CS_DEV_SetGameState extends CS_Base {
	type: CS_Type.CS_DEV_SetGameState,
	state: number,
}

/**
 * Sent to inform server that a player has chosen a worm
 * @param wormId identifier for the chosen worm
 */
export interface CS_WormChosen extends CS_Base {
	type: CS_Type.CS_WormChosen,
	wormId: number,
}

/**
 * Sent to inform server that a player has chosen a weapon
 * @param id Identifier of that weapon (seee shared/weapons/weaponIds)
 */
export interface CS_WeaponChosen extends CS_Base {
	type: CS_Type.CS_WeaponChosen,
	id: number,
}

/**
 * Sent to inform server that a player has chosen a worm
 * @param angle the angle to aim at (bjs angle)
 */
export interface CS_AimAngle extends CS_Base {
	type: CS_Type.CS_AimAngle,
	angle: number,
}

/**
 * Sent to inform server that a player has chosen a worm
 * @param angle new angle for target Direction in bjs units
 */
export interface CS_AimTargetAngle extends CS_Base {
	type: CS_Type.CS_AimTargetAngle,
	angle: number,
}

/**
 * Sent when client moves target to another position
 * @param point coordinates of new point
 */
export interface CS_AimMoveTarget extends CS_Base {
	type: CS_Type.CS_AimMoveTarget,
	point: pointData,
}

/**
 * Sent when server needs client to change aim state
 * @param entering wether we are entering or exiting the aim state
 * @param stateId identifier for the state we are talking about
 */
export interface CS_SwitchAimState extends CS_Base {
	type: CS_Type.CS_SwitchAimState,
	entering: boolean,
	stateId: aimStateId,
}

/**
 * Sent when client wants to tell server to reset their aiming back to the first state
 */
export interface CS_CancelAiming extends CS_Base {
	type: CS_Type.CS_CancelAiming,
}

/**
 * Sent when Worm moves with significant speed
 */
export interface CS_WormPosition extends CS_Base {
	type: CS_Type.CS_WormPosition,
	wormId: number,
	pos: pointData,
}

export interface CS_EndAimState extends CS_Base {
	type: CS_Type.CS_EndAimState,
	wormAngle: number,
	position: pointData
	targetAngle: number,
	force: number,
	explosions: Array<explosionData>,
}

/**
 * Sent when Client has handled their stuff in hte end of their turn
 */
export interface CS_ClientFinishedTurn extends CS_Base {
	type: CS_Type.CS_ClientFinishedTurn,
}

/**
 * Sent when Client has handled their stuff in hte end of their turn
 */
export interface CS_IWIN extends CS_Base {
	type: CS_Type.CS_IWIN,
}

// ENDSCREEN ==================================================================
/**
 * DEV MODE, delete later
 */
export interface CS_DEV_StartEndscreen extends CS_Base {
	type: CS_Type.CS_DEV_StartEndscreen,
	won: boolean,
	winnerId: string,
}

export type CS_GenericPacket = 
			CS_ConnectAttempt | CS_JoinLobby | CS_ReadyChange |
			CS_DEV_StartLobby | CS_UpdateSettings | CS_LoadingProgress |
			CS_FinishedLoading | CS_FailedLoading | CS_DEV_StartLoading |
			CS_DEV_ButtonPress | CS_DEV_StartGame | CS_DEV_StartEndscreen |
			CS_GetGameState | CS_DEV_SetGameState | CS_RequestChangeGameState |
			CS_WormChosen | CS_EndAimState | CS_WeaponChosen |
			CS_AimMoveTarget | CS_SwitchAimState | CS_AimTargetAngle |
			CS_AimAngle | CS_CancelAiming | CS_IWIN |
			CS_WormPosition | CS_ClientFinishedTurn
			;