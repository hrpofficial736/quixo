export interface FileTransferMetaDataRequestInterface {
  name: string;
  size: number;
  chunkSize: number;
  mime: string;
}
export interface TransferInterface extends FileTransferMetaDataRequestInterface {
  current: boolean;
}
