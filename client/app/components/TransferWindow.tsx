import FileTransferProgressComponent from "@/components/FileTransferProgressComponent";
import FileTransferRequestComponent from "@/components/FileTransferRequestComponent";
import Window from "@/components/Window";
import { useAppSocket } from "@/context/SocketContext";
import useHandleFileTransfer from "@/hooks/useHandleFileTransfer";
import socketManager from "@/services/socketManager";
import { useConnectionStatusStore } from "@/stores/useConnectionStatusStore";
import { useFileTransferStore } from "@/stores/useFileTransferStore";
import { useUserStore } from "@/stores/useUserStore";
import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";
import {
  FileTransferMetaDataRequestInterface,
  TransferInterface,
} from "@/types/fileTransferInterfaces";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { emitEvent } = socketManager();
  const socket = useAppSocket();
  const { datachannel, setPC, setDataChannel, closePC } =
    useWebRTCConnectionStore();
  const [requests, setRequests] = useState<
    FileTransferMetaDataRequestInterface[]
  >([]);
  const fileRef = useRef<File | null>(null);
  const { sendFile, sendExtraInfo, listenForExtraInfo, listenForFile } =
    useHandleFileTransfer();

  const [transfers, setTransfers] = useState<TransferInterface[]>([]);

  const handleResponse = (res: boolean) => {
    sendExtraInfo(datachannel!, {
      name: "METADATA-ACK",
      res: res ? "ACC" : "REJ",
    });
    setRequests([]);
    if (res) {
      const fileInfo = {
        name: requests[0].name,
        size: requests[0].size,
        mime: requests[0].mime,
        chunkSize: requests[0].chunkSize,
      };
      useFileTransferStore.getState().setFileMetadata(fileInfo);
      setTransfers((prev) => {
        const current = prev.length === 0;
        return [
          ...prev,
          {
            ...fileInfo,
            current,
          },
        ];
      });
    }
  };

  const handleFileChange = () => {
    const file = fileInputRef.current?.files![0];
    console.log(file?.name, file?.size);
    fileRef.current = file!;
    sendExtraInfo(datachannel!, {
      name: "META",
      fileName: file?.name,
      size: file?.size,
      mime: file?.type,
      chunkSize: 16384,
    });
  };

  // Event for listening file metadata on receiver end
  useEffect(() => {
    const cleanup = listenForExtraInfo(datachannel!, "META", (info) => {
      const data = info as FileTransferMetaDataRequestInterface;
      if (requests.length === 0) {
        setRequests((prev) => [
          ...prev,
          {
            name: data.name,
            size: data.size,
            chunkSize: 16384,
            mime: data.mime,
          },
        ]);
      }
    });
    return cleanup;
  }, [datachannel, requests]);

  // Event for listening file metadata acknowledgement on sender end
  useEffect(() => {
    const cleanup = listenForExtraInfo(datachannel!, "METADATA-ACK", (res) => {
      console.log("inside file request ack listener!", fileRef.current);

      if (res) {
        sendFile(datachannel!, fileRef.current!, () => {
          setTransfers((prev) => prev.slice(1));
        });
        const fileInfo = {
          name: fileRef.current?.name as string,
          size: fileRef.current?.size as number,
          mime: fileRef.current?.type as string,
          chunkSize: 16384,
        };
        useFileTransferStore.getState().setFileMetadata(fileInfo);
        setTransfers((prev) => {
          const current = prev.length === 0;
          return [
            ...prev,
            {
              ...fileInfo,
              current,
            },
          ];
        });
      } else toast.error("File transfer request rejected by the receiver!");
    });
    return cleanup;
  }, [datachannel]);

  // Event for listening completion of file transfer on receiver end
  useEffect(() => {
    const cleanup = listenForExtraInfo(datachannel!, "FILE_SENT", (res) => {
      console.log("inside file transfer completion listener!");

      if (res) {
        toast.success("File sent successfully!");
        setTransfers((prev) => prev.slice(1));
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
                    setDataChannel(null);
                    closePC();
                    setPC(null);
                    emitEvent(socket!, "delete_room", {
                      pairingId: useUserStore.getState().pairingId,
                    });
                    toast.success(
                      "Disconnected with " +
                        useUserStore.getState().otherDeviceName,
                    );
                    useUserStore.setState(useUserStore.getInitialState());
                    useWebRTCConnectionStore.setState(
                      useWebRTCConnectionStore.getInitialState(),
                    );
                    useFileTransferStore.setState(
                      useFileTransferStore.getInitialState(),
                    );
                    useConnectionStatusStore.setState(
                      useConnectionStatusStore.getInitialState(),
                    );
                    router.push("/");
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
                onChange={handleFileChange}
              />
              {transfers.map((transfer, index) => {
                return (
                  <FileTransferProgressComponent
                    key={index}
                    fileInfo={transfer}
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
