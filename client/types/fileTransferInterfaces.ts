export interface FileTransferMetaDataRequestInterface {
  id?: string;
  name: string;
  size: number;
  chunkSize: number;
  mime: string;
  offset?: number;
}

export interface TransferInterface extends FileTransferMetaDataRequestInterface {
  current: "IN_PROGRESS" | "WAITING_FOR_DATACHANNEL" | "PAUSED" | "WAITING_FOR_RESPONSE";
  pausedBy?: "self" | "peer";
}

export interface ExtraInfoHandlerParamsInterface {
  res: boolean;
  id?: string;
}
