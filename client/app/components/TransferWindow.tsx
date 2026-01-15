import FileTransferProgressComponent from "@/components/FileTransferProgressComponent";
import FileTransferRequestComponent from "@/components/FileTransferRequestComponent";
import Window from "@/components/Window";
import { useAppSocket } from "@/context/SocketContext";
import useHandleFileTransfer from "@/hooks/useHandleFileTransfer";
import socketManager from "@/services/socketManager";
import { useFileTransferStore } from "@/stores/useFileTransferStore";
import { useUserStore } from "@/stores/useUserStore";
import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";
import {
  FileTransferMetaDataRequestInterface,
  TransferInterface,
} from "@/types/fileTransferInterfaces";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoIosSend } from "react-icons/io";

export default function TransferWindow({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { emitEvent } = socketManager();
  const socket = useAppSocket();
  const { datachannel, closePC } = useWebRTCConnectionStore();
  const [requests, setRequests] = useState<
    FileTransferMetaDataRequestInterface[]
  >([]);
  const { sendFile, sendExtraInfo, listenForExtraInfo, listenForFile } =
    useHandleFileTransfer();

  const filesRef = useRef<Map<string, File> | null>(null);

  const [transfers, setTransfers] = useState<TransferInterface[]>([]);

  // const transferQueue = useRef<TransferInterface[]>([]); // Removed in favor of state+ref pattern
  // const activeTransferId = useRef<string | null>(null); // Unused
  const isTransferringRef = useRef(false);
  const activeAbortController = useRef<AbortController | null>(null);

  const handleResponse = (res: boolean, id: string) => {
    sendExtraInfo(datachannel!, {
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
    // 1. Remove from UI immediately
    setTransfers((prev) => prev.filter((t) => t.id !== id));

    // 2. Notify Peer
    sendExtraInfo(datachannel!, {
      name: "FILE_TRANSFER_CANCELLED",
      id,
    });

    // 3. Abort if active (Sender side mostly, but Receiver uses this to stop download stream effectively??
    // Actually receiver doesn't have an abort controller for download listener...
    // but the sender aborting will stop the stream.)
    // However, if WE are the Sender and we click cancel:
    const active = transfersRef.current.find((t) => t.current === "START");
    if (active && active.id === id) {
      activeAbortController.current?.abort();
      isTransferringRef.current = false;
    }
  };

  const handleFileChange = () => {
    if (!fileInputRef.current || !fileInputRef.current.files) return;
    for (const file of fileInputRef.current.files) {
      const fileInfo = {
        name: "META",
        id: crypto.randomUUID(),
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
      sendExtraInfo(datachannel!, fileInfo);
    }
  };

  // Keep a ref to transfers to avoid re-binding event listeners on every state change
  const transfersRef = useRef(transfers);
  useEffect(() => {
    transfersRef.current = transfers;
  }, [transfers]);

  // Event for listening file metadata on receiver end
  useEffect(() => {
    const cleanup = listenForExtraInfo(datachannel!, "META", (info) => {
      const data = info as FileTransferMetaDataRequestInterface;

      // Check if this is a "Start Signal" for an existing transfer (Receiver side)
      // Read from ref to avoid dependency loop
      const isExistingTransfer = transfersRef.current.some(
        (t) => t.id === data.id,
      );

      if (isExistingTransfer) {
        setTransfers((prev) =>
          prev.map((t) => (t.id === data.id ? { ...t, current: "START" } : t)),
        );
        return;
      }

      // Otherwise, it's a new request
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
  }, [datachannel, listenForExtraInfo]); // Removed transfers from dependency!

  // Event for cancellation
  useEffect(() => {
    const cleanup = listenForExtraInfo(
      datachannel!,
      "FILE_TRANSFER_CANCELLED",
      (data) => {
        if (!data || !data.id) return;

        // Remove from list
        setTransfers((prev) => prev.filter((t) => t.id !== data.id));

        // Abort if active
        // Only relevant if WE are sending and THEY cancelled
        const active = transfersRef.current.find((t) => t.current === "START");
        if (active && active.id === data.id) {
          activeAbortController.current?.abort();
          isTransferringRef.current = false;
          toast.error("Transfer cancelled by peer");
        }
      },
    );
    return cleanup;
  }, [datachannel, listenForExtraInfo]);

  // Queue Processor
  useEffect(() => {
    // Only the SENDER runs this queue logic (indicated by filesRef presence)
    if (!filesRef.current) return;

    if (isTransferringRef.current) return;

    const nextTransfer = transfers.find((t) => t.current === "WAIT");

    if (nextTransfer && datachannel) {
      isTransferringRef.current = true;
      // Mark as started in UI
      setTransfers((prev) =>
        prev.map((t) =>
          t.id === nextTransfer.id ? { ...t, current: "START" } : t,
        ),
      );

      const file = filesRef.current?.get(nextTransfer.id!);
      if (file) {
        const fileInfo = {
          name: nextTransfer.name || "",
          size: nextTransfer.size,
          mime: nextTransfer.mime,
          chunkSize: nextTransfer.chunkSize,
        };
        useFileTransferStore.getState().setFileMetadata(fileInfo);

        // RESEND META to reset context on Receiver for this specific file
        
        sendExtraInfo(datachannel, {
          name: "META",
          id: nextTransfer.id,
          fileName: nextTransfer.name,
          size: nextTransfer.size,
          mime: nextTransfer.mime,
          chunkSize: nextTransfer.chunkSize,
        });

        // Setup AbortController
        const controller = new AbortController();
        activeAbortController.current = controller;

        // Small delay to ensure META arrives before bytes? usually ordered on DataChannel
        sendFile(datachannel, file, controller.signal, () => {
          isTransferringRef.current = false;
          activeAbortController.current = null;
          // Only remove if it hasn't been cancelled/removed already
          setTransfers((prev) => prev.filter((t) => t.id !== nextTransfer.id));
        });
      } else {
        // Error case: file missing, unblock queue
        isTransferringRef.current = false;
        setTransfers((prev) => prev.filter((t) => t.id !== nextTransfer.id));
      }
    }
  }, [transfers, datachannel, sendFile, sendExtraInfo]);

  // Event for listening file metadata acknowledgement on sender end
  useEffect(() => {
    const cleanup = listenForExtraInfo(datachannel!, "METADATA-ACK", (data) => {
      if (!data || !("res" in data) || !data.id) return;
      // Use ref to check length/existence to avoid re-binding
      if (!filesRef.current || transfersRef.current.length === 0) return;


      if (data.res) {
        // Mark the specific transfer as 'WAIT' so the effect picks it up
        setTransfers((prev) =>
          prev.map((t) => (t.id === data.id ? { ...t, current: "WAIT" } : t)),
        );
      } else {
        setTransfers((prev) => {
          return prev.filter((transfer) => transfer.id !== data.id);
        });
        toast.error("File transfer request rejected by the receiver!");
      }
    });
    return cleanup;
  }, [datachannel, listenForExtraInfo]); // Removed transfers from dependency!

  // Event for listening completion of file transfer on receiver end
  useEffect(() => {
    const cleanup = listenForExtraInfo(datachannel!, "FILE_SENT", (data) => {
      if (!data) return;
      if (!("res" in data)) return;

      if (data.res) {
        // Check if ID is provided (Receiver Cleanup Fix)
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
        toast.error("Error sending full file!");
      }
    });
    return cleanup;
  }, [datachannel]);

  useEffect(() => {
    if (!datachannel) return;
    const cleanup = listenForFile(datachannel);
    return cleanup;
  }, [datachannel]);

  return (
    <div className="w-full h-full">
      {isOpen && (
        <Window
          header="File Transfer"
          extraClass="w-full h-full"
          onClose={onClose}
          showClose={false}
        >
          <div className="text-textSecondary w-full h-[90%] mt-10 flex flex-col gap-2 overflow-y-scroll">
            {/*Connected Devices*/}
            <div className="flex flex-col gap-4 w-full">
              <h1 className="font-semibold text-sm text-textTertiary">
                Connected Devices
              </h1>
              <div className="flex justify-between items-center bg-bgTertiary/10 rounded-xl w-full p-4">
                <div className="text-textTertiary text-sm font-semibold">
                  {useUserStore.getState().otherDeviceName}
                </div>

                <button
                  onClick={() => {
                    datachannel?.close();
                    closePC();
                    emitEvent(socket!, "delete_room", {
                      pairingId: useUserStore.getState().pairingId,
                    });
                  }}
                  className="bg-linear-to-b from-error to-error/50 text-textPrimary rounded-lg text-sm px-3 py-2 font-semibold cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/*Send Files*/}
            <div className="flex flex-col gap-2 mt-10">
              <div className="flex justify-between items-center">
                <h1 className="font-semibold text-sm text-textTertiary">
                  Send Files
                </h1>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="rounded-md px-2 py-1 text-sm f-c-row gap-2 max-w-60 bg-linear-to-b from-textSecondary to-textSecondary/80 text-bgSecondary font-semibold cursor-pointer"
                >
                  <IoIosSend />
                  Send Files
                </button>
              </div>
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                multiple
                onChange={handleFileChange}
              />
              {transfers.map((transfer) => {
                return (
                  <FileTransferProgressComponent
                    key={transfer.id}
                    fileInfo={transfer}
                    onCancel={handleCancel}
                  />
                );
              })}
              <h1 className="text-xs w-full f-c-row mt-10 font-semibold text-textTertiary">
                No ongoing transfers
              </h1>
            </div>

            {/*Transfer Requests*/}
            <div className="flex flex-col gap-2 mt-10">
              <h1 className="font-semibold text-sm text-textTertiary">
                Requests
              </h1>
              {requests.length > 0 ? (
                <div className="f-c-col gap-2 w-full">
                  {requests?.map((request, index) => {
                    return (
                      <FileTransferRequestComponent
                        key={index}
                        info={request}
                        handler={handleResponse}
                      />
                    );
                  })}
                </div>
              ) : (
                <h1 className="text-xs w-full f-c-row mt-10 font-semibold text-textTertiary">
                  No requests yet
                </h1>
              )}
            </div>
          </div>
        </Window>
      )}
    </div>
  );
}
