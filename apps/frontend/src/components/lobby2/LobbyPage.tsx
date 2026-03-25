// 1. Define the "Struct" for our arguments (Props)
interface LobbyProps {
  onNavigate: (newState: string) => void; 
}

// 2. Accept the props in the function signature
export default function Loading({ onNavigate }: LobbyProps) {
  return (
    <div>
      <h1 className="text-green-500">Lobby</h1>
      <button className="border-2 border-solid rounded-xl bg-slate-700  w-30 h-10" onClick={() => {onNavigate("LOADING")}}>Load Assets</button>
    </div>
  );
}
