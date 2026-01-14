export interface FileTransferMetaDataRequestInterface {
  id?: string;
  name: string;
  size: number;
  chunkSize: number;
  mime: string;
}
export interface TransferInterface extends FileTransferMetaDataRequestInterface {
  current: "START" | "WAIT" | "STOP";
}

export interface ExtraInfoHandlerParamsInterface {
  res: boolean;
  id?: string;
}
