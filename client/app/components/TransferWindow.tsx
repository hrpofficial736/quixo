import ConnectedDevicesSection from "@/components/transfer/ConnectedDevicesSection";
import RequestsSection from "@/components/transfer/RequestsSection";
import SendFilesSection from "@/components/transfer/SendFilesSection";
import useHandleFileTransfer from "@/hooks/useHandleFileTransfer";
import { useTransferActions } from "@/hooks/useTransferActions";
import { useTransferListeners } from "@/hooks/useTransferListeners";
import { useTransferQueue } from "@/hooks/useTransferQueue";
import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";
import Logo from "@/components/Logo";
import {
  FileTransferMetaDataRequestInterface,
  TransferInterface,
} from "@/types/fileTransferInterfaces";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

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
    handleSelectFilesAndSendTransferRequest,
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
    setTransfers,
  );

  useEffect(() => {
    resumeTransferRef.current = resumeTransfer;
  }, [resumeTransfer]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex flex-col"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <Logo />
        <ConnectedDevicesSection />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-8">
          <SendFilesSection
            transfers={transfers}
            onFileChange={(e) =>
              handleSelectFilesAndSendTransferRequest(e, pc)
            }
            onCancel={handleCancelTransfer}
            onPause={handlePauseTransfer}
            onResume={(id) => handleResumeTransfer(id, resumeTransfer)}
          />
          <RequestsSection
            requests={requests}
            onResponse={handleAcceptOrRejectResponse}
          />
        </div>
      </div>
    </motion.div>
  );
}
