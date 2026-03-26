// 1. Define the "Struct" for our arguments (Props)
interface LobbyProps {
  msgToServer: (data: string) => void;
  lastReceivedMsg: string;
}

export default function Lobby({ msgToServer, lastReceivedMsg }: LobbyProps) {
  return (
    <div>
      <h1 className="text-blue-500">Loading...</h1>
      <button className="border-2 border-solid rounded-xl bg-slate-700  w-30 h-10" onClick={
        () => {
          msgToServer(JSON.stringify({type: "cs.DEV.start.game"}));
        }
      }>Start Game</button>
    </div>
    );
}