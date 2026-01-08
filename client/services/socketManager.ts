import { SocketListenForEventInterface } from "@/types/socketResponses";

let socket: WebSocket | null = null;
const listeners = new Map<string, ((data: any) => void)[]>();

export default function socketManager() {
  return { createSocket, getSocket, emitEvent, listenEvent, disconnect };
}

function createSocket(onOpenHandler: (ws: WebSocket) => void) {
  socket = new WebSocket(process.env.NEXT_PUBLIC_SERVER_URL!);

  socket.onopen = () => {
    console.log("websocket connected!");
    onOpenHandler(socket!);
  };

  socket.onerror = (e) => {
    console.error("websocket error: ", e);
  };

  socket.onmessage = (event) => {
    try {
      const { eventName, data, success, message } = JSON.parse(event.data);
      dispatch(eventName, { eventName, data, success, message });
    } catch (e) {
      console.log("invalid websocket message...: ", e);
    }
  };
  return socket;
}

const getSocket = () => socket;

function emitEvent(ws: WebSocket, event: string, data: object) {
  try {
    if (ws) {
      console.log(ws.readyState);
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
    console.log(e);
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
