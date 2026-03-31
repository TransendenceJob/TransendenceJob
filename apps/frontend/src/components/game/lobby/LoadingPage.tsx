interface Params {
  msgToServer: (data: string) => void;
}

/**
 * Component for page, where the Clients and Server load the game logic,
 * while the Client page shows a progress bar to notify the client about progress
 * @param msgToServer function for sending packet to server
 */
export default function LoadingPage({ msgToServer }: Params) {
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
