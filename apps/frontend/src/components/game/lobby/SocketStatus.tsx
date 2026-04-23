interface Params {
  isConnected: boolean,
}

/**
 * Element that displays if websocket connection exists
 * @param isConnected bool wether connection is established
 */
export default function SocketStatus({
  isConnected
}: Params) {
  let status: string = 'Disonnected';
  const generalFormat: string = "fixed top-0 right-0 "
  let statusFormat: string = "right-4 text-red-500"

  if (isConnected) {
    statusFormat = "right-7 text-green-500";
    status = 'Connected';
  }

  return (<div>
            <h1 className="fixed top-0 right-27.5 text-neutral-950">Websocket:</h1>
            <h1 className={generalFormat + statusFormat}>{status}</h1>
          </div>
  );
}
