export interface FileTransferMetaDataRequestInterface {
  id?: string;
  name: string;
  size: number;
  chunkSize: number;
  mime: string;
  offset?: number;
}

export interface TransferInterface extends FileTransferMetaDataRequestInterface {
  current: "START" | "WAIT" | "STOP" | "PAUSED";
}

export interface ExtraInfoHandlerParamsInterface {
  res: boolean;
  id?: string;
}
