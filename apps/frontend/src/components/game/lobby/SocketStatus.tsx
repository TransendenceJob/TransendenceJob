// 1. Define the "Struct" for our arguments (Props)
interface LobbyProps {
  isConnected: boolean;
}

// 2. Accept the props in the function signature
export default function SocketStatus({ isConnected }: LobbyProps) {
  let status: string = 'Disonnected';
  const generalFormat: string = "fixed top-5 right-5 "
  let statusFormat: string = "text-red-500"
  if (isConnected)
  {
    statusFormat = "right-8 text-green-500";
    status = 'Connected';
  }
  return (<div>
            <h1 className="fixed top-5 right-28.5 text-neutral-950">Websocket:</h1>
            <h1 className={generalFormat + statusFormat}>{status}</h1>
          </div>
  );
}
