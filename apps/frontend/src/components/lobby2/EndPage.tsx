interface LobbyProps {
  onNavigate: (newState: string) => void; 
}

export default function Lobby({ onNavigate }: LobbyProps) {
  return (
    <div>
      <h1 className="text-red-500">End Screen</h1>
      <button className="border-2 border-solid rounded-xl bg-slate-700  w-30 h-10" onClick={() => {onNavigate("LOBBY")}}>Start Game</button>
    </div>
    );
}