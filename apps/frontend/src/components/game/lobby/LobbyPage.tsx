import SocketStatus from "./SocketStatus";

// 1. Define the "Struct" for our arguments (Props)
interface LobbyProps {
  msgToServer: (data: string) => void;
  lastReceivedMsg: string;
}

// 2. Accept the props in the function signature
export default function Loading({ msgToServer, lastReceivedMsg }: LobbyProps) {
  return (
    <div>
      <h1 className="text-green-500">Lobby</h1>
      <SocketStatus />
      <button className="border-2 border-solid rounded-xl bg-slate-700  w-30 h-10" onClick={
        () => {
          msgToServer(JSON.stringify({type: "cs.DEV.start.loading"}));
        }
        }>Load Assets</button>
    </div>
  );
}
