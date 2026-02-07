import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";
import {
  FileTransferMetaDataRequestInterface,
  TransferInterface,
} from "@/types/fileTransferInterfaces";
import { RefObject } from "react";

export function useTransferActions(
    controlDatachannel: RTCDataChannel | null,
    transfersRef: RefObject<TransferInterface[]>,
    filesRef: RefObject<Map<string, File> | null>,
    setTransfers: React.Dispatch<React.SetStateAction<TransferInterface[]>>,
    setRequests: React.Dispatch<React.SetStateAction<FileTransferMetaDataRequestInterface[]>>,
    requests: FileTransferMetaDataRequestInterface[],
    abortControllers: RefObject<Map<string, AbortController>>,
    isTransferringRef: RefObject<boolean>,
    sendExtraInfo: (dc: RTCDataChannel, data: object) => void
) {
    const { closeFileDataChannel } = useWebRTCConnectionStore();

    const handleResponse = (res: boolean, id: string) => {
        if (!controlDatachannel) return;
        sendExtraInfo(controlDatachannel, {
          name: "METADATA-ACK",
          id,
          res: res ? "ACC" : "REJ",
        });
        setRequests((prev) => {
          return prev.filter((request) => request.id !== id);
        });
        if (res) {
          const fileInfo = requests.filter((request) => request.id === id)[0];
          setTransfers((prev) => {
            return [
              ...prev,
              {
                ...fileInfo,
                current: "WAIT",
              },
            ];
          });
        }
    };
    
    const handleCancel = (id: string) => {
        if (!controlDatachannel) return;
        setTransfers((prev) => prev.filter((t) => t.id !== id));
    
        sendExtraInfo(controlDatachannel, {
          name: "FILE_TRANSFER_CANCELLED",
          id,
        });
    
        const controller = abortControllers.current.get(id);
        if (controller) {
          controller.abort();
          abortControllers.current.delete(id);
          if (abortControllers.current.size === 0) {
            isTransferringRef.current = false;
          }
        }
        closeFileDataChannel(id);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, pc: RTCPeerConnection | null) => {
        if (
          !e.target.files ||
          !pc ||
          !controlDatachannel
        )
          return;
        for (const file of e.target.files) {
          const fileInfo = {
            id: crypto.randomUUID(),
            name: "META",
            fileName: file.name,
            size: file.size,
            mime: file.type,
            chunkSize: 16384,
          };
    
          if (!filesRef.current) {
            filesRef.current = new Map();
          }
          filesRef.current.set(fileInfo.id, file);
          setTransfers((prev) => [
            ...prev,
            {
              id: fileInfo.id,
              name: fileInfo.fileName,
              size: fileInfo.size,
              chunkSize: fileInfo.chunkSize,
              mime: fileInfo.mime,
              current: "STOP",
            },
          ]);
          sendExtraInfo(controlDatachannel, fileInfo);
        }
    };
    
    const handlePause = (id: string) => {
        const target = transfersRef.current?.find((t) => t.id === id);
        if (!target) return;
    
        if (controlDatachannel) {
          sendExtraInfo(controlDatachannel, { name: "FILE_PAUSE", id });
        }
    
        const controller = abortControllers.current.get(id);
        if (controller) {
            controller.abort();
            abortControllers.current.delete(id);
            if (abortControllers.current.size === 0) {
                isTransferringRef.current = false;
            }
        }
    
        setTransfers((prev) =>
          prev.map((t) => (t.id === id ? { ...t, current: "PAUSED" } : t)),
        );
    };
    
  const handleResume = (id: string) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, current: "WAIT" } : t)),
    );
    if (controlDatachannel) {
      sendExtraInfo(controlDatachannel, { name: "FILE_RESUME", id });
    }
  };

    return {
        handleResponse,
        handleCancel,
        handleFileChange,
        handlePause,
        handleResume,
    }
}
