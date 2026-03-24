// 1. Define the "Struct" for our arguments (Props)
interface LobbyProps {
  onNavigate: (newState: string) => void; 
}

// 2. Accept the props in the function signature
export default function Loading({ onNavigate }: LobbyProps) {
  return (
    <div>
      <h1>Lobby</h1>
      <button onClick={() => {onNavigate("LOADING")}}>Load Assets</button>
    </div>
  );
}
