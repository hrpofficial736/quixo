import { SocketListenForEventInterface } from "@/types/socketResponses";
import toast from "react-hot-toast";

let socket: WebSocket | null = null;

export default function useSocket() {
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
  ws: WebSocket,
  listener: (params: SocketListenForEventInterface) => void,
) {
  if (ws) {
    ws.onmessage = (event) => {
      try {
        const { eventName, data, success, message } = JSON.parse(event.data);
        listener({ eventName, data, success, message });
      } catch (e) {
        console.log("invalid websocket message...: ", e);
      }
    };
  } else {
    console.error("No websocket connection found!");
  }
}

function disconnect() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
