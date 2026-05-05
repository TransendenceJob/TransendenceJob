// import * from 'ClientServerPackets.ts';


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
}

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

// ENDSCREEN ==================================================================

/**
 * DEV MODE, delete later
 */
export interface CS_DEV_StartEndscreen extends CS_Base {
	type: CS_Type.CS_DEV_StartEndscreen,
}

export type CS_GenericPacket = 
			CS_ConnectAttempt | CS_ReadyChange | CS_DEV_StartLobby |
			CS_LoadingProgress |
			CS_FinishedLoading | CS_FailedLoading | CS_DEV_StartLoading |
			CS_DEV_ButtonPress | CS_DEV_StartGame | CS_DEV_StartEndscreen |
			CS_GetGameState | CS_DEV_SetGameState
			;