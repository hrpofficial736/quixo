import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";

export default function useSocket() {
  return { getSocket, emitEvent, listenEvent, disconnect };
}

function getSocket() {
  const socket = io(process.env.NEXT_PUBLIC_SERVER_URL);
  return socket;
}

function emitEvent(
  socket: Socket,
  event: string,
  data: object,
  ack: (success: boolean, message: string, ...args: object[]) => void,
) {
  try {
    socket.emit(event, data, ack);
  } catch (e) {
    toast.error("Unexpected error occured, please try again later.");
  }
}

function listenEvent(socket: Socket, event: string, listener: () => void) {
  try {
    socket.on(event, listener);
  } catch (e) {
    toast.error("Unexpected error occured, please try again later.");
  }
}

function disconnect(socket: Socket) {
  socket.disconnect();
}
