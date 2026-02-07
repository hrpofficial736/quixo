import { TransferInterface } from "@/types/fileTransferInterfaces";
import { RefObject, useEffect } from "react";
import { useFileTransferStore } from "@/stores/useFileTransferStore";
import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";

export function useTransferQueue(
  transfers: TransferInterface[],
  setTransfers: React.Dispatch<React.SetStateAction<TransferInterface[]>>,
  filesRef: RefObject<Map<string, File> | null>,
  isTransferringRef: RefObject<boolean>,
  activeAbortControllerRef: RefObject<Map<string, AbortController>>,
  controlDatachannel: RTCDataChannel | null,
  pc: RTCPeerConnection | null,
  sendFile: (
    dc: RTCDataChannel,
    file: File,
    startOffset: number,
    signal?: AbortSignal,
    onComplete?: () => void,
  ) => Promise<number>,
  sendExtraInfo: (dc: RTCDataChannel, info: object) => void,
) {
  // Queue Processor
  useEffect(() => {
    // Only the SENDER runs this queue logic
    if (!filesRef.current) return;
    if (!pc || !controlDatachannel) return;

    const nextTransfer = transfers.filter((t) => t.current === "WAIT");

    if (nextTransfer.length > 0 && controlDatachannel) {
      isTransferringRef.current = true;

      // Mark as started in UI
      setTransfers((prev) =>
        prev.map((t) =>
          nextTransfer.some((nt) => nt.id === t.id)
            ? { ...t, current: "START" }
            : t,
        ),
      );

      nextTransfer.forEach((transfer) => {
        if (!transfer.id) return;
        const file = filesRef.current?.get(transfer.id);
        if (file) {
          const fileInfo = {
            id: transfer.id,
            name: transfer.name || "",
            size: transfer.size,
            mime: transfer.mime,
            chunkSize: transfer.chunkSize,
          };

          useFileTransferStore.getState().addFile(fileInfo);

          const isResume = (transfer.offset || 0) > 0;

          sendExtraInfo(controlDatachannel, {
            name: "META",
            id: transfer.id,
            fileName: transfer.name,
            size: transfer.size,
            mime: transfer.mime,
            chunkSize: transfer.chunkSize,
            resume: isResume,
          });

          const controller = new AbortController();
          activeAbortControllerRef.current.set(transfer.id, controller);

          const fileDatachannels =
            useWebRTCConnectionStore.getState().fileDatachannels;

          const fileChannel = fileDatachannels.find(
            (channel) => channel.label === `file-${transfer.id}`,
          );

          if (!fileChannel) {
            activeAbortControllerRef.current.delete(transfer.id); // clean up if failed
            return;
          }

          sendFile(
            fileChannel,
            file,
            transfer.offset || 0,
            controller.signal,
            () => {
              console.log(`Transfer ${transfer.id} completed`)
            },
          ).then((finalOffset: number) => {
            activeAbortControllerRef.current.delete(transfer.id!);
            if (activeAbortControllerRef.current.size === 0) {
              isTransferringRef.current = false;
            }

            setTransfers((prev) => {
              const currentT = prev.find((t) => t.id === transfer.id);
              if (!currentT) return prev;

              if (finalOffset === transfer.size) {
                return prev.filter((t) => t.id !== transfer.id);
              } else {
                return prev.map((t) =>
                  t.id === transfer.id
                    ? {
                        ...t,
                        offset: finalOffset,
                        current: "PAUSED",
                      }
                    : t,
                );
              }
            });
          });
        } else {
          isTransferringRef.current = false;
          setTransfers((prev) => prev.filter((t) => t.id !== transfer.id));
        }
      });
    }
  }, [
    transfers,
    controlDatachannel,
    sendFile,
    sendExtraInfo,
    pc,
    activeAbortControllerRef,
    filesRef,
    setTransfers,
    isTransferringRef,
  ]);
}
