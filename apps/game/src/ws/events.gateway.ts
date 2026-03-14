import { SubscribeMessage, WebSocketGateway, OnGatewayInit, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';


@WebSocketGateway({
	cors: {
		origin: '*'
	},
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

	@WebSocketServer() server: Server;
	private logger: Logger = new Logger("EventsGateway");

	// Listens to a specific "event" (msgToServer) on the websocket
	@SubscribeMessage('msgToServer')
	handleMessage(client: Socket, payload: string): void {
		// Logger
		this.logger.log(`Message received: ${payload}`);
		// Returns another event on the websocket, which can be received by the client
		this.server.emit('msgToClient', `${payload}`);
	}

	afterInit(server: Server)
	{
		this.logger.log('Initiated');
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`);
	}

	handleConnection(client: Socket, ...args: any[]) {
		this.logger.log(`Client connected: ${client.id}`);
	}
}