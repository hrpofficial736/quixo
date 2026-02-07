import {
  ExtraInfoHandlerParamsInterface,
  FileTransferMetaDataRequestInterface,
  TransferInterface,
} from "@/types/fileTransferInterfaces";
import { RefObject, useEffect } from "react";
import toast from "react-hot-toast";
import rtcManager from "@/services/rtcManager";

export function useTransferListeners(
  controlDatachannel: RTCDataChannel | null,
  pc: RTCPeerConnection | null,
  transfersRef: RefObject<TransferInterface[]>,
  filesRef: RefObject<Map<string, File> | null>,
  isTransferringRef: RefObject<boolean>,
  abortControllers: RefObject<Map<string, AbortController>>,
  setTransfers: React.Dispatch<React.SetStateAction<TransferInterface[]>>,
  setRequests: React.Dispatch<
    React.SetStateAction<FileTransferMetaDataRequestInterface[]>
  >,
  listenForExtraInfo: (
    dc: RTCDataChannel,
    eventName: string,
    handler: (
      info?:
        | FileTransferMetaDataRequestInterface
        | ExtraInfoHandlerParamsInterface,
    ) => void,
  ) => void,
) {
  const { createDataChannel } = rtcManager();

  // Event: Meta (Receiver)
  useEffect(() => {
    if (!controlDatachannel) return;
    const cleanup = listenForExtraInfo(controlDatachannel, "META", (info) => {
      const data = info as FileTransferMetaDataRequestInterface;
      // Check existing
      const isExistingTransfer = transfersRef.current!.some(
        (t) => t.id === data.id,
      );

      if (isExistingTransfer) {
        setTransfers((prev) =>
          prev.map((t) => (t.id === data.id ? { ...t, current: "START" } : t)),
        );
        return;
      }

      // New Request
      setRequests((prev) => {
        if (prev.some((r) => r.id === data.id)) return prev;
        return [
          ...prev,
          {
            id: data.id,
            name: data.name,
            size: data.size,
            chunkSize: 16384,
            mime: data.mime,
          },
        ];
      });
    });
    return cleanup;
  }, [
    controlDatachannel,
    listenForExtraInfo,
    setTransfers,
    setRequests,
    transfersRef,
  ]);

  // Event: Metadata ACK (Sender)
  useEffect(() => {
    if (!controlDatachannel) return;
    const cleanup = listenForExtraInfo(
      controlDatachannel,
      "METADATA-ACK",
      (data) => {
        if (!data || !("res" in data) || !data.id || !pc) return;
        // Only Sender cares about ACK (has filesRef)
        if (!filesRef.current || transfersRef.current!.length === 0) return;

        console.log("METADATA-ACK received", data);
        if (data.res) {
          setTransfers((prev) =>
            prev.map((t) => (t.id === data.id ? { ...t, current: "WAIT" } : t)),
          );
          createDataChannel(pc, `file-${data.id}`, () => {
            console.log("Data channel for file transfer opened");
          });
        } else {
          setTransfers((prev) => {
            return prev.filter((transfer) => transfer.id !== data.id);
          });
          toast.error("File transfer request rejected by the receiver!");
        }
      },
    );
    return cleanup;
  }, [
    controlDatachannel,
    listenForExtraInfo,
    createDataChannel,
    pc,
    filesRef,
    setTransfers,
    transfersRef,
  ]);

  // Event: Cancelled
  useEffect(() => {
    if (!controlDatachannel) return;
    const cleanup = listenForExtraInfo(
      controlDatachannel,
      "FILE_TRANSFER_CANCELLED",
      (data) => {
        if (!data || !data.id) return;

        setTransfers((prev) => prev.filter((t) => t.id !== data.id));

        const controller = abortControllers.current.get(data.id);
        if (controller) {
          controller.abort();
          abortControllers.current.delete(data.id);
          if (abortControllers.current.size === 0) {
            isTransferringRef.current = false;
          }
          toast.error("Transfer cancelled by peer");
        }
      },
    );
    return cleanup;
  });

  // Event: Pause/Resume
  useEffect(() => {
    if (!controlDatachannel) return;

    const cleanupPause = () =>
      listenForExtraInfo(controlDatachannel, "FILE_PAUSE", (data) => {
        if (!data?.id) return;
        console.log("[Remote PAUSE] Received for:", data.id);

        setTransfers((prev) =>
          prev.map((t) => (t.id === data.id ? { ...t, current: "PAUSED" } : t)),
        );

        const controller = abortControllers.current.get(data.id);
        if (controller) {
          console.log("[Remote PAUSE] Aborting active stream (if sender)...");
          controller.abort();
          abortControllers.current.delete(data.id);
          if (abortControllers.current.size === 0) {
            isTransferringRef.current = false;
          }
        }
      });

    const cleanupResume = () =>
      listenForExtraInfo(controlDatachannel, "FILE_RESUME", (data) => {
        if (!data?.id) return;
        console.log("[Remote RESUME] Received for:", data.id);

        setTransfers((prev) =>
          prev.map((t) => (t.id === data.id ? { ...t, current: "WAIT" } : t)),
        );
      });

    return () => {
      cleanupPause();
      cleanupResume();
    };
  }, [
    controlDatachannel,
    listenForExtraInfo,
    abortControllers,
    setTransfers,
    isTransferringRef,
  ]);

  // Event: File Sent
  useEffect(() => {
    if (!controlDatachannel) return;
    const cleanup = listenForExtraInfo(
      controlDatachannel,
      "FILE_SENT",
      (data) => {
        if (!data) return;
        if (!("res" in data)) return;
        console.log("FILE_SENT received", data);
        if (data.res) {
          if (data.id) {
            toast.success("File received successfully!");
            setTransfers((prev) =>
              prev.filter((transfer) => transfer.id !== data.id),
            );
          } else {
            console.warn(
              "FILE_SENT received without ID, cannot clean up specific file.",
            );
          }
        } else {
          toast.error(`Error occurred while receiving a file`);
          setTransfers((prev) =>
            prev.filter((transfer) => transfer.id !== data.id),
          );
        }
      },
    );
    return cleanup;
  }, [controlDatachannel, listenForExtraInfo, setTransfers]);
}
