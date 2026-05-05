export type SSEEventHandler = (event: SSEEvent) => void;

export interface SSEEvent {
  type: string;
  data: any;
}

export class SSEClient {
  private eventSource: EventSource | null = null;
  private url: string;
  private handlers: Map<string, SSEEventHandler[]> = new Map();
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(url: string) {
    this.url = url;
  }

  on(eventType: string, handler: SSEEventHandler) {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  connect() {
    this.eventSource = new EventSource(this.url);

    this.eventSource.onopen = () => {
      this.reconnectDelay = 1000;
    };

    for (const [eventType, eventHandlers] of this.handlers) {
      this.eventSource.addEventListener(eventType, (e: MessageEvent) => {
        let data: any;
        try {
          data = JSON.parse(e.data);
        } catch {
          data = e.data;
        }
        for (const handler of eventHandlers) {
          handler({ type: eventType, data });
        }
      });
    }

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    this.reconnectTimer = setTimeout(() => {
      this.connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  close() {
    this.eventSource?.close();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
  }
}

export function runChainSSE(body: any): SSEClient {
  // Fetch to start execution, then return SSE client for stream
  const client = new SSEClient("/api/run-chain");
  return client;
}

export async function startRun(body: any): Promise<SSEClient> {
  // POST to start execution, get run ID back, then connect SSE
  const res = await fetch("/api/run-chain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to start run");
  }
  const { runId } = await res.json();
  const client = new SSEClient(`/api/run-chain/stream?runId=${runId}`);
  return client;
}
