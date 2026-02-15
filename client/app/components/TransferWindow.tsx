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
  const [requests, setRequests] = useState<
    FileTransferMetaDataRequestInterface[]
  >([]);
  const { sendExtraInfo, listenForExtraInfo, sendFile, listenForFile } =
    useHandleFileTransfer();
  const filesRef = useRef<Map<string, File> | null>(null);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const transfersRef = useRef<Map<string, TransferInterface>>(new Map());

  const [transfers, setTransfers] = useState<TransferInterface[]>([]);
  const resumeTransferRef = useRef<((fileId: string) => void) | null>(null);
  

  // Hooks
  const {
    handleAcceptOrRejectResponse,
    handleCancelTransfer,
    handlePauseTransfer,
    handleResumeTransfer,
    handleSelectFilesAndSendTransferRequest
  } = useTransferActions(
    controlDatachannel,
    transfersRef,
    setTransfers,
    filesRef,
    setRequests,
    requests,
    abortControllers,
    sendExtraInfo,
  );

  useTransferListeners(
    controlDatachannel,
    pc,
    transfersRef,
    filesRef,
    abortControllers,
    setRequests,
    setTransfers,
    listenForExtraInfo,
    listenForFile,
    resumeTransferRef,
  );

  const { resumeTransfer } = useTransferQueue(
    fileDatachannels,
    transfersRef,
    filesRef,
    abortControllers,
    sendFile,
    setTransfers
  );
  
  useEffect(() => {
    resumeTransferRef.current = resumeTransfer;
  }, [resumeTransfer]);

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
              onFileChange={(e) => handleSelectFilesAndSendTransferRequest(e, pc)}
              onCancel={handleCancelTransfer}
              onPause={handlePauseTransfer}
              onResume={(id) => handleResumeTransfer(id, resumeTransfer)}
            />
            <RequestsSection requests={requests} onResponse={handleAcceptOrRejectResponse} />
          </div>
        </Window>
      )}
    </div>
  );
}
