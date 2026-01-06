export interface SocketSendResponse {
  eventName: string;
  data: object;
}

export interface SocketListenForEventInterface {
  eventName: string;
  data: { [key: string]: object };
  success: boolean;
  message: string;
}
