import FileTransferProgressComponent from "@/components/FileTransferProgressComponent";
import FileTransferRequestComponent from "@/components/FileTransferRequestComponent";
import Window from "@/components/Window";
import { useAppSocket } from "@/context/SocketContext";
import useHandleFileTransfer from "@/hooks/useHandleFileTransfer";
import rtcManager from "@/services/rtcManager";
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
  // Reference to input element with type file
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Service Managers
  const { emitEvent } = socketManager();
  const { createDataChannel } = rtcManager();

  // Global App Socket
  const socket = useAppSocket();

  // Web RTC store for peer connections and data channels
  const {
    controlDatachannel,
    setFileDataChannels,
    closeFileDataChannel,
    closePC,
    pc,
  } = useWebRTCConnectionStore();

  // State to keep current pending requests
  const [requests, setRequests] = useState<
    FileTransferMetaDataRequestInterface[]
  >([]);

  // Main hook for using functions to send/listen the files/metadata
  const { sendFile, sendExtraInfo, listenForExtraInfo, listenForFile } =
    useHandleFileTransfer();

  // Reference of files with their id
  const filesRef = useRef<Map<string, File> | null>(null);

  // State to keep all the current transfers
  const [transfers, setTransfers] = useState<TransferInterface[]>([]);

  // Reference of current transfer state
  const isTransferringRef = useRef(false);

  // Reference of abort controller to abort an operation
  const activeAbortController = useRef<AbortController | null>(null);

  // Handler for handling Accept/Reject choice for a file by the user
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

  // Handler for handling cancel for a specific transfer
  const handleCancel = (id: string) => {
    if (!controlDatachannel) return;
    // 1. Remove from UI immediately
    setTransfers((prev) => prev.filter((t) => t.id !== id));

    // 2. Notify Peer
    sendExtraInfo(controlDatachannel, {
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
    closeFileDataChannel(id);
  };

  // Handler for handling files input selection and sending metadata
  const handleFileChange = () => {
    if (
      !fileInputRef.current ||
      !fileInputRef.current.files ||
      !pc ||
      !controlDatachannel
    )
      return;
    for (const file of fileInputRef.current.files) {
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

  // Keep a ref to transfers to avoid re-binding event listeners on every state change
  const transfersRef = useRef(transfers);
  useEffect(() => {
    transfersRef.current = transfers;
  }, [transfers]);

  // Event for listening file metadata on receiver end
  useEffect(() => {
    if (!controlDatachannel) return;
    const cleanup = listenForExtraInfo(controlDatachannel, "META", (info) => {
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
  }, [controlDatachannel, listenForExtraInfo]); // Removed transfers from dependency!

  // Event for cancellation
  useEffect(() => {
    if (!controlDatachannel) return;
    const cleanup = listenForExtraInfo(
      controlDatachannel,
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
  }, [controlDatachannel, listenForExtraInfo]);

  // Queue Processor
  useEffect(() => {
    // Only the SENDER runs this queue logic (indicated by filesRef presence)
    if (!filesRef.current) return;

    if (isTransferringRef.current) return;

    if (!pc || !controlDatachannel) return;

    const nextTransfer = transfers.find((t) => t.current === "WAIT");

    if (nextTransfer && controlDatachannel) {
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

        sendExtraInfo(controlDatachannel, {
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

        const fileDatachannels =
          useWebRTCConnectionStore.getState().fileDatachannels;

        const fileChannel = fileDatachannels.find(
          (channel) => channel.label === `file-${nextTransfer.id}`,
        );
        console.log("this is the filechannel: ", fileChannel);
        if (!fileChannel) return;
        // Small delay to ensure META arrives before bytes? usually ordered on DataChannel
        sendFile(fileChannel, file, controller.signal, () => {
          console.log("SEND FILE callback");
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
  }, [transfers, controlDatachannel, sendFile, sendExtraInfo, pc]);

  // Event for listening file metadata acknowledgement on sender end
  useEffect(() => {
    if (!controlDatachannel) return;
    const cleanup = listenForExtraInfo(
      controlDatachannel,
      "METADATA-ACK",
      (data) => {
        if (!data || !("res" in data) || !data.id || !pc) return;
        // Use ref to check length/existence to avoid re-binding
        if (!filesRef.current || transfersRef.current.length === 0) return;
        console.log("METADATA-ACK received", data);
        if (data.res) {
          // Mark the specific transfer as 'WAIT' so the effect picks it up
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
  }, [controlDatachannel, listenForExtraInfo, createDataChannel, pc]);

  // Event for listening completion of file transfer on receiver end
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
      },
    );
    return cleanup;
  }, [controlDatachannel, listenForExtraInfo]);

  useEffect(() => {
    const fileDatachannels =
      useWebRTCConnectionStore.getState().fileDatachannels;
    console.log("File datachannels", fileDatachannels);
    fileDatachannels.forEach((channel) => {
      console.log("File datachannel", channel);
      listenForFile(channel);
    });
  }, [controlDatachannel, listenForFile, transfers, requests]);

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
                    useWebRTCConnectionStore
                      .getState()
                      .fileDatachannels.forEach((channel) => channel.close());
                    setFileDataChannels(null);
                    controlDatachannel?.close();
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
                    isPaused={transfer.current === "WAIT"}
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
