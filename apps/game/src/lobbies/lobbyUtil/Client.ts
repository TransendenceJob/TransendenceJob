export interface LoadingStatus {
  progress: number;
  msg: string;
  done: boolean;
  failed: boolean;
}

export interface Client {
  id: string;
  name: string;
  slot: number;
  socketId: string;
  ready: boolean;
  loading: LoadingStatus;
}

export function resetClient(client: Client) {
  client.ready = false;
  client.loading.done = false;
  client.loading.failed = false;
  client.loading.msg = 'Starting Loading';
  client.loading.progress = 0;
}
