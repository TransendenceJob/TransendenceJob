import { useGameContext } from './GameContext';
/**
 * Component for page, where the Clients may connect to a Lobby,
 * switch their readines and potentiallyh alter some settings
 * @param msgToServer function for sending packet to server
 */
export default function EndPage() {
  const {winner, userId } = useGameContext();
  if (winner != userId) {
    return (
      <div>
        <h1 className="text-red-500">You loose</h1>
      </div>
      );
  }
  else {
    return (
      <div>
        <h1 className="text-green-500">You win!!!!</h1>
      </div>
      );
  }
}
