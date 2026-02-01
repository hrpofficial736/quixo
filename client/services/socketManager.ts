import { SocketListenForEventInterface } from "@/types/socketResponses";

let socket: WebSocket | null = null;
const listeners = new Map<
  string,
  ((data: SocketListenForEventInterface) => void)[]
>();

export default function socketManager() {
  return {
    createSocket,
    getSocket,
    emitEvent,
    listenEvent,
    disconnect,
    removeAllListeners,
  };
}

function createSocket(onOpenHandler: (ws: WebSocket) => void, errorHandler: () => void) {
  socket = new WebSocket(
    `${process.env.NEXT_PUBLIC_SERVER_URL}`,
  );

  socket.onopen = () => {
    onOpenHandler(socket!);
  };

  socket.onerror = (e) => {
    errorHandler();
  };

  socket.onmessage = (event) => {
    try {
      const { eventName, data, success, message } = JSON.parse(event.data);
      dispatch(eventName, { eventName, data, success, message });
    } catch (e) {
    }
  };
  return socket;
}

const getSocket = () => socket;

function emitEvent(ws: WebSocket, event: string, data: object) {
  try {
    if (ws) {
      if (ws.readyState !== WebSocket.OPEN) {
        console.error("socket is not ready");
        return;
      }
      ws.send(
        JSON.stringify({
          eventName: event,
          data,
        }),
      );
    } else {
      console.error("no websocket found!");
    }
  } catch (e) {
  }
}

function listenEvent(
  eventName: string,
  listener: (params: SocketListenForEventInterface) => void,
) {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, []);
  }
  listeners.get(eventName)?.push(listener);
}

function dispatch(eventName: string, data: SocketListenForEventInterface) {
  listeners.get(eventName)?.forEach((handler) => {
    handler(data);
  });
}

function disconnect() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

function removeAllListeners(eventName?: string) {
  if (eventName) {
    listeners.delete(eventName);
  } else {
    listeners.clear();
  }
}
