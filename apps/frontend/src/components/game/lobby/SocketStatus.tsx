import { Socket } from 'socket.io-client';

// 1. Define the "Struct" for our arguments (Props)
interface LobbyProps {
  socket: Socket;
}

// 2. Accept the props in the function signature
export default function SocketStatus({ socket }: LobbyProps) {
  if (socket && socket.connected)	
    return (<div><h1 className="text-green-500">Websocket Connected</h1></div>);
  else
    return (<div><h1 className="fixed top-10 text-red-500">Websocket Disonnected</h1></div>);
}
