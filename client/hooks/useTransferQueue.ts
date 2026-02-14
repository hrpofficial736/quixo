import { useFileTransferStore } from "@/stores/useFileTransferStore";
import { TransferInterface } from "@/types/fileTransferInterfaces";
import { RefObject, useEffect } from "react";

export function useTransferQueue(
  fileDataChannels: RTCDataChannel[],
  transfersRef: RefObject<Map<string, TransferInterface>>,
  filesRef: RefObject<Map<string, File> | null>,
  abortControllers: RefObject<Map<string, AbortController>>,
  sendFile: (
    dc: RTCDataChannel,
    file: File,
    startOffset: number,
    signal?: AbortSignal,
    onComplete?: () => void,
  ) => Promise<number>,
  setTransfers: React.Dispatch<React.SetStateAction<TransferInterface[]>>,
) {

  const startSending = (channel: RTCDataChannel, fileId: string, startOffset: number) => {
    if (!filesRef.current) return;
    const file = filesRef.current.get(fileId);
    if (!file) {
      console.error(`[Queue] File object not found for ${fileId}`);
      return;
    }

    if (abortControllers.current.has(fileId)) {
      console.warn(`[Queue] Transfer already active for ${fileId}`);
      return;
    }

    const abortController = new AbortController();
    abortControllers.current.set(fileId, abortController);

    console.log(`[Queue] Calling sendFile for ${fileId} at offset ${startOffset}`);
    sendFile(channel, file, startOffset, abortController.signal, () => {
      console.log(`[Queue] Transfer complete for ${fileId}`);
      setTransfers(prev => prev.filter(t => t.id !== fileId));
      abortControllers.current.delete(fileId);
    });
  };

  // Handle new channels (initial transfer start)
  useEffect(() => {
    fileDataChannels.forEach((channel) => {
      const fileId = channel.label.slice(5);
      const transfer = transfersRef.current.get(fileId);

      if (!transfer) return;

      const startTransfer = () => {
        const currentTransfer = transfersRef.current.get(fileId);
        if (currentTransfer && currentTransfer.current === "IN_PROGRESS") return;

        console.log(`[Queue] Starting transfer for ${fileId}`);

        const updatedTransfer = {
          ...transfer,
          current: (transfer.current === "WAITING_FOR_DATACHANNEL" ? "IN_PROGRESS" : "PAUSED") as TransferInterface["current"]
        };

        transfersRef.current.set(fileId, updatedTransfer);
        setTransfers(prev => prev.map(t => t.id === fileId ? updatedTransfer : t));

        if (transfer.current === "WAITING_FOR_DATACHANNEL" || transfer.current === "WAITING_FOR_RESPONSE") {
          startSending(channel, fileId, 0);
        }
      };

      if (channel.readyState === "open" && transfer.current !== "IN_PROGRESS") {
        startTransfer();
      } else if (channel.readyState === "connecting") {
        console.log(`[Queue] Channel for ${fileId} is connecting, attaching 'open' listener`);
        const onOpen = () => {
          console.log(`[Queue] Channel for ${fileId} is now open (listener triggered)`);
          startTransfer();
          channel.removeEventListener("open", onOpen);
        };
        channel.addEventListener("open", onOpen);
      }
    });
  }, [fileDataChannels, transfersRef, abortControllers, filesRef, sendFile, setTransfers]);

  // Handle resume: when a transfer changes from PAUSED to IN_PROGRESS, re-call sendFile
  const resumeTransfer = (fileId: string) => {
    const channel = fileDataChannels.find(ch => ch.label === `file-${fileId}`);
    if (!channel || channel.readyState !== "open") {
      console.error(`[Queue] No open channel found for resume of ${fileId}`);
      return;
    }

    const savedOffset = useFileTransferStore.getState().files.get(fileId)?.offset ?? 0;
    console.log(`[Queue] Resuming transfer for ${fileId} from offset ${savedOffset}`);
    startSending(channel, fileId, savedOffset);
  };

  return { resumeTransfer };
}

