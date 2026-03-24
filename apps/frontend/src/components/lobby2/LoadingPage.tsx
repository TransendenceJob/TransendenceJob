interface LobbyProps {
  onNavigate: (newState: string) => void; 
}

export default function Lobby({ onNavigate }: LobbyProps) {
  return (
    <div>
      <h1>Loading...</h1>
      <button onClick={() => {onNavigate("LOBBY")}}>Start Game</button>
    </div>
    );
}