export default function Loading({ onStart}: { onStart: () => void }) {
  return (
    <div>
      <h1>Loading...</h1>
      <button onClick={onStart}>Start Game</button>
    </div>
    );
}