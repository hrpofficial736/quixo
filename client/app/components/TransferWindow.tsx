import Window from "@/components/Window";
import ConnectedDevicesSection from "@/components/transfer/ConnectedDevicesSection";
import RequestsSection from "@/components/transfer/RequestsSection";
import SendFilesSection from "@/components/transfer/SendFilesSection";
import useHandleFileTransfer from "@/hooks/useHandleFileTransfer";
import { useTransferActions } from "@/hooks/useTransferActions";
import { useTransferListeners } from "@/hooks/useTransferListeners";
import { useTransferQueue } from "@/hooks/useTransferQueue";
import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";
import {
  FileTransferMetaDataRequestInterface,
  TransferInterface,
} from "@/types/fileTransferInterfaces";
import { useEffect, useRef, useState } from "react";

export default function TransferWindow({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { controlDatachannel, fileDatachannels, pc } =
    useWebRTCConnectionStore();

  const listeningChannels = useRef(new Set<string>());
  const [requests, setRequests] = useState<
    FileTransferMetaDataRequestInterface[]
  >([]);
  const { sendFile, sendExtraInfo, listenForExtraInfo, listenForFile } =
    useHandleFileTransfer();
  const filesRef = useRef<Map<string, File> | null>(null);
  const [transfers, setTransfers] = useState<TransferInterface[]>([]);
  const isTransferringRef = useRef(false);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const transfersRef = useRef(transfers);
  useEffect(() => {
    transfersRef.current = transfers;
  }, [transfers]);

  // Hooks
  const {
    handleResponse,
    handleCancel,
    handleFileChange,
    handlePause,
    handleResume,
  } = useTransferActions(
    controlDatachannel,
    transfersRef,
    filesRef,
    setTransfers,
    setRequests,
    requests,
    abortControllers,
    isTransferringRef,
    sendExtraInfo,
  );

  useTransferListeners(
    controlDatachannel,
    pc,
    transfersRef,
    filesRef,
    isTransferringRef,
    abortControllers,
    setTransfers,
    setRequests,
    listenForExtraInfo,
  );

  useTransferQueue(
    transfers,
    setTransfers,
    filesRef,
    isTransferringRef,
    abortControllers,
    controlDatachannel,
    pc,
    sendFile,
    sendExtraInfo,
  );

  // Listener Attachment
  useEffect(() => {
    fileDatachannels.forEach((dc) => {
      if (!listeningChannels.current.has(dc.label)) {
        if (dc.label === "control") return;
        listenForFile(dc);
        listeningChannels.current.add(dc.label);
      }
    });
  }, [fileDatachannels, listenForFile]);

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
            <ConnectedDevicesSection />
            <SendFilesSection
              transfers={transfers}
              onFileChange={(e) => handleFileChange(e, pc)}
              onCancel={handleCancel}
              onPause={handlePause}
              onResume={handleResume}
            />
            <RequestsSection requests={requests} onResponse={handleResponse} />
          </div>
        </Window>
      )}
    </div>
  );
}
