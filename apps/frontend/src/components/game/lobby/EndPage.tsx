interface Params {
  msgToServer: (data: string) => void;
}

/**
 * Component for page, where the Clients may connect to a Lobby,
 * switch their readines and potentiallyh alter some settings
 * @param msgToServer function for sending packet to server
 */
export default function EndPage({ msgToServer }: Params) {
  return (
    <div>
      <h1 className="text-red-500">End Screen</h1>
      <button className="border-2 border-solid rounded-xl bg-slate-700  w-30 h-10" onClick={
        () => {
          msgToServer(JSON.stringify({type: "cs.DEV.start.lobby"}));
        }
      }>Start Game</button>
    </div>
    );
}
