/** BroadcastChannel によるタブ間リアルタイム同期。チャンネル名は呼び出し側で指定する */
interface BroadcastPayload {
  type: string;
  payload: unknown;
  timestamp: number;
}

export function createChannel(name: string): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(name);
}

export function broadcast(channel: BroadcastChannel | null, type: string, payload: unknown): void {
  if (!channel) return;
  try {
    channel.postMessage({ type, payload, timestamp: Date.now() });
  } catch {
    // silently ignore
  }
}

export function subscribe(
  channel: BroadcastChannel | null,
  handler: (msg: BroadcastPayload) => void,
): () => void {
  if (!channel) return () => {};
  const listener = (e: MessageEvent) => {
    const msg = e.data;
    if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') return;
    handler(msg as BroadcastPayload);
  };
  channel.addEventListener('message', listener);
  return () => channel.removeEventListener('message', listener);
}
