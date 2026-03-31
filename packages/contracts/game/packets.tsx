export enum PacketTypes {
	CS_CONN_ATTEMPT = "cs.connection.attempt",
	CS_DISCON = "cs.disconnect",
}

export interface CsPackConnectionAttempt {
	type: PacketTypes.CS_CONN_ATTEMPT,
	lobbyId: number,
}

export interface CsPackDisconnect {
	type: PacketTypes.CS_DISCON;
	lobbyId: number,
	userKey: number,
}