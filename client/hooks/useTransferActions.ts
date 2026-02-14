import { EVENTS } from "@/lib/events";
import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";
import { useFileTransferStore } from "@/stores/useFileTransferStore";
import {
  FileTransferMetaDataRequestInterface,
  TransferInterface,
} from "@/types/fileTransferInterfaces";
import { RefObject } from "react";

export function useTransferActions(
    controlDatachannel: RTCDataChannel | null,
  transfersRef: RefObject<Map<string, TransferInterface>>,
    setTransfers: React.Dispatch<React.SetStateAction<TransferInterface[]>>,
    filesRef: RefObject<Map<string, File> | null>,
    setRequests: React.Dispatch<React.SetStateAction<FileTransferMetaDataRequestInterface[]>>,
    requests: FileTransferMetaDataRequestInterface[],
    abortControllers: RefObject<Map<string, AbortController>>,
    sendExtraInfo: (dc: RTCDataChannel, data: object) => void
) {
    const { closeFileDataChannel } = useWebRTCConnectionStore();

    const handleAcceptOrRejectResponse = (res: boolean, id: string) => {
        if (!controlDatachannel) return;
        sendExtraInfo(controlDatachannel, {
          eventName: EVENTS.METADATA_ACK,
          id,
          res: res ? "ACC" : "REJ",
        });
        setRequests((prev) => {
          return prev.filter((request) => request.id !== id);
        });
        if (res) {
          const fileInfo = requests.filter((request) => request.id === id)[0];
          const updatedTransfer = {...fileInfo, current: "WAITING_FOR_DATACHANNEL" as TransferInterface["current"]};
          transfersRef.current.set(id, updatedTransfer);
          setTransfers((prev) => [...prev, updatedTransfer]);
        }
    };
    
    const handleCancelTransfer = (id: string) => {
        if (!controlDatachannel) return;
        transfersRef.current.delete(id);
    
        sendExtraInfo(controlDatachannel, {
          eventName: EVENTS.FILE_TRANSFER_CANCELLED,
          id,
        });
    
        const controller = abortControllers.current.get(id);
        if (controller) {
          controller.abort();
          abortControllers.current.delete(id);
        }
        closeFileDataChannel(id);
    };
    
    const handleSelectFilesAndSendTransferRequest = (e: React.ChangeEvent<HTMLInputElement>, pc: RTCPeerConnection | null) => {
        if (
          !e.target.files ||
          !pc ||
          !controlDatachannel
        )
          return;
        for (const file of e.target.files) {
          const fileInfo = {
            eventName: EVENTS.META,
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            mime: file.type,
            chunkSize: 16384,
          };
    
          if (!filesRef.current) {
            filesRef.current = new Map();
          }
          filesRef.current.set(fileInfo.id, file);
          const {id, name, size, mime, chunkSize} = fileInfo;
          transfersRef.current.set(id, {
            id,
            name,
            size,
            mime,
            chunkSize,
            current: "WAITING_FOR_RESPONSE",
          },)

          // Register in the file transfer store so progress updates work
          useFileTransferStore.getState().addFile({id, name, size, mime, chunkSize});

          console.log("sending metadata to receiver...", fileInfo)
          setTransfers((prev) => {
            if (prev.some(t => t.id === fileInfo.id)) return prev;
            return [...prev, {...fileInfo, current: "WAITING_FOR_RESPONSE"}];
          });
          sendExtraInfo(controlDatachannel, fileInfo);
        }
    };
    
  const handlePauseTransfer = (id: string) => {
      if (!controlDatachannel) return;
        const target = transfersRef.current.get(id);
        if (!target) return;
    
        // Abort the active sendFile
        const controller = abortControllers.current.get(id);
        if (controller) {
            controller.abort();
            abortControllers.current.delete(id);
        }

        // Update transfer state
        transfersRef.current.set(id, {
            ...target,
            current: "PAUSED",
            pausedBy: "self",
        });
        setTransfers(prev => prev.map(t => t.id === id ? { ...t, current: "PAUSED", pausedBy: "self" } : t));
    
        // Update store
        useFileTransferStore.getState().updateStatus(id, "PAUSED");

        // Notify peer
        sendExtraInfo(controlDatachannel, { eventName: EVENTS.FILE_PAUSE, id });
    };
    
  const handleResumeTransfer = (id: string, resumeTransfer?: (fileId: string) => void) => {
    const target = transfersRef.current.get(id);
    if (!target) return;
    
    // Update transfer state
    transfersRef.current.set(id, {
        ...target,
        current: "IN_PROGRESS",
        pausedBy: undefined,
    });
    setTransfers(prev => prev.map(t => t.id === id ? { ...t, current: "IN_PROGRESS", pausedBy: undefined } : t));

    // Update store
    useFileTransferStore.getState().updateStatus(id, "IN_PROGRESS");

    // Notify peer
    if (controlDatachannel) {
      sendExtraInfo(controlDatachannel, { eventName: EVENTS.FILE_RESUME, id });
    }

    // Resume sending from saved offset
    if (resumeTransfer) {
      resumeTransfer(id);
    }
  };

    return {
      handleAcceptOrRejectResponse,
      handleCancelTransfer,
      handleSelectFilesAndSendTransferRequest,
      handlePauseTransfer,
      handleResumeTransfer,
    }
}
