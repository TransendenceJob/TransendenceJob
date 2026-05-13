
import { RefObject, createContext, useContext } from 'react';
import { Client } from '@/shared/packets/Client';
import type { msgToServerType } from '@/lib/packets/msgToServerType';
import { Socket } from 'socket.io-client';

export interface GameContextType {
	state: string;
	stateRef: RefObject<string>;
	setState: (state: string) => void;
	lobbyId: number;
	lobbyIdRef: RefObject<number>;
	setLobbyId: (id: number) => void;
	slots: Array<Client>;
	isConnected: boolean;
	msgToServer: msgToServerType;
	socketRef: RefObject<Socket | null>;
	userId: string;
	userName: string;
	errorMsg: string;
	DEBUG: boolean;
}

export const GameContext = createContext<GameContextType | null>(null);

export const useGameContext = () => {
	const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameContext must be used within a GameContext.Provider");
  return ctx;
}