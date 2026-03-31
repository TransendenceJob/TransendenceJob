interface Params {
  isConnected: boolean;
}

/**
 * Element that displays if websocket connection exists
 * @param isConnected bool wether connection is established
 */
export default function SocketStatus({ isConnected }: Params) {
  let status: string = 'Disonnected';
  const generalFormat: string = "fixed top-5 right-5 "
  let statusFormat: string = "text-red-500"

  if (isConnected) {
    statusFormat = "right-8 text-green-500";
    status = 'Connected';
  }

  return (<div>
            <h1 className="fixed top-5 right-28.5 text-neutral-950">Websocket:</h1>
            <h1 className={generalFormat + statusFormat}>{status}</h1>
          </div>
  );
}
