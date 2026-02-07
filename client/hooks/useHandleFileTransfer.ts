import {
  listenForExtraInfo as lfei,
  listenForFile as lff,
  sendExtraInfo as sei,
  sendFile as sf,
} from "@/services/fileTransferService";
import {
  ExtraInfoHandlerParamsInterface,
  FileTransferMetaDataRequestInterface,
} from "@/types/fileTransferInterfaces";
import { useCallback } from "react";

export default function useHandleFileTransfer() {
  const listenForFile = useCallback((dc: RTCDataChannel) => {
    return lff(dc);
  }, []);

  const listenForExtraInfo = useCallback(
    (
      dc: RTCDataChannel,
      eventName: string,
      handler: (
        info?:
          | FileTransferMetaDataRequestInterface
          | ExtraInfoHandlerParamsInterface,
      ) => void,
    ) => {
      return lfei(dc, eventName, handler);
    },
    [],
  );

  const sendFile = useCallback(
    (
      dc: RTCDataChannel,
      file: File,
      startOffset: number = 0,
      signal?: AbortSignal,
      onComplete?: () => void,
    ) => sf(dc, file, startOffset, signal, onComplete),
    [],
  );

  const sendExtraInfo = useCallback(
    (dc: RTCDataChannel, data: object) => sei(dc, data),
    [],
  );

  return {
    listenForFile,
    listenForExtraInfo,
    sendFile,
    sendExtraInfo,
  };
}
