export interface SocketSendResponse {
  eventName: string;
  data: object;
}

export interface SocketListenForEventInterface {
  eventName: string;
  data: { [key: string]: object | string };
  success: boolean;
  message: string;
}

export interface QRCodeDataInterface {
  deviceName: string;
  redirectUrl: string;
  pairingId: string;
  status: "WAITING" | "CONNECTED" | "OFFLINE";
}
