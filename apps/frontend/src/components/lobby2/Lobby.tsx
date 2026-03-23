export default function Lobby({ onStart}: { onStart: () => void }) {
  return (
    <div>
      <h1>Lobby</h1>
      <button onClick={onStart}>Start Game</button>
    </div>
  );
}
