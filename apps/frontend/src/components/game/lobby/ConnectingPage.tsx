import { useEffect } from 'react';

// 1. Define the "Struct" for our arguments (Props)
interface LobbyProps {
  msgToServer: (data: string) => void;
  isConnected: boolean
}


export default function ConnectingPage({ msgToServer, isConnected }: LobbyProps) {
  useEffect(() => {
    if (isConnected)
    {
      const connectionPacket = {type: "cs.connection.attempt"}
      msgToServer(JSON.stringify(connectionPacket));
    }
  }, [isConnected, msgToServer]);
  return (
    <div>
      <h1 className="text-purple-500">Connecting to Game Server...</h1>
    </div>
  );
}
