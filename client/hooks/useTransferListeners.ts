import {
  ExtraInfoHandlerParamsInterface,
  FileTransferMetaDataRequestInterface,
  TransferInterface,
} from "@/types/fileTransferInterfaces";
import { RefObject, useEffect } from "react";
import toast from "react-hot-toast";
import rtcManager from "@/services/rtcManager";
import { EVENTS } from "@/lib/events";
import { useFileTransferStore } from "@/stores/useFileTransferStore";
import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";

export function useTransferListeners(
  controlDatachannel: RTCDataChannel | null,
  pc: RTCPeerConnection | null,
  transfersRef: RefObject<Map<string, TransferInterface>>,
  filesRef: RefObject<Map<string, File> | null>,
  abortControllers: RefObject<Map<string, AbortController>>,
  setRequests: React.Dispatch<
    React.SetStateAction<FileTransferMetaDataRequestInterface[]>
  >,
  setTransfers: React.Dispatch<React.SetStateAction<TransferInterface[]>>,
  listenForExtraInfo: (
    dc: RTCDataChannel,
    eventName: string,
    handler: (
      info?:
        | FileTransferMetaDataRequestInterface
        | ExtraInfoHandlerParamsInterface,
    ) => void,
  ) => (() => void) | undefined,
  listenForFile: (dc: RTCDataChannel) => void,
  resumeTransferRef: RefObject<((fileId: string) => void) | null>,
) {
  const { createDataChannel } = rtcManager();

  const listenForMetaEvent = (
    info?:
      | FileTransferMetaDataRequestInterface
      | ExtraInfoHandlerParamsInterface,
  ) => {
    const data = info as FileTransferMetaDataRequestInterface;
    console.log("METADATA received", data);
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
  };

  const listenForMetaAckEvent = (
    data?:
      | FileTransferMetaDataRequestInterface
      | ExtraInfoHandlerParamsInterface,
  ) => {
    if (!data || !("res" in data) || !data.id || !pc) return;

    if (!filesRef.current || !transfersRef.current) return;

    if (data.res) {
      createDataChannel(pc, `file-${data.id}`, () => {
        console.log("Data channel for file transfer opened");
      });
      const target = transfersRef.current.get(data.id);
      if (target) {
        const updated = { ...target, current: "WAITING_FOR_DATACHANNEL" as TransferInterface["current"] };
        transfersRef.current.set(data.id, updated);
        setTransfers(prev => prev.map(t => t.id === data.id ? updated : t));
      }
    } else {
      transfersRef.current.delete(data.id);
      setTransfers(prev => prev.filter(t => t.id !== data.id));
      toast.error("File transfer request rejected by the receiver!");
    }
  };

  const listenForCancelTransferEvent = (
    data?:
      | FileTransferMetaDataRequestInterface
      | ExtraInfoHandlerParamsInterface,
  ) => {
    if (!data || !data.id) return;

    transfersRef.current.delete(data.id);
    setTransfers(prev => prev.filter(t => t.id !== data.id));
    setRequests(prev => prev.filter(r => r.id !== data.id));
    const controller = abortControllers.current.get(data.id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(data.id);
    }
    toast.error("Transfer cancelled by peer");
  };

  const listenForPauseTransferEvent = (
    data?:
      | FileTransferMetaDataRequestInterface
      | ExtraInfoHandlerParamsInterface,
  ) => {
    if (!data || !data.id) return;
    const target = transfersRef.current.get(data.id);
    if (!target) return;

    // If we are the sender, abort the active sendFile
    const controller = abortControllers.current.get(data.id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(data.id);
    }

    transfersRef.current.set(data.id, {
      ...target,
      current: "PAUSED",
      pausedBy: "peer",
    });
    setTransfers(prev => prev.map(t => t.id === data.id ? { ...t, current: "PAUSED", pausedBy: "peer" } : t));
    useFileTransferStore.getState().updateStatus(data.id, "PAUSED");
  };

  const listenForResumeTransferEvent = (
    data?:
      | FileTransferMetaDataRequestInterface
      | ExtraInfoHandlerParamsInterface,
  ) => {
    if (!data || !data.id) return;
    const target = transfersRef.current.get(data.id);
    if (!target) return;
    transfersRef.current.set(data.id, {
      ...target,
      current: "IN_PROGRESS",
      pausedBy: undefined,
    });
    setTransfers(prev => prev.map(t => t.id === data.id ? { ...t, current: "IN_PROGRESS", pausedBy: undefined } : t));
    useFileTransferStore.getState().updateStatus(data.id, "IN_PROGRESS");

    // If we are the sender, resume sending from saved offset
    if (resumeTransferRef.current) {
      resumeTransferRef.current(data.id);
    }
  };

  const listenForFileSentEvent = (
    info?:
      | FileTransferMetaDataRequestInterface
      | ExtraInfoHandlerParamsInterface,
  ) => {
    if (!info) return;
    const data = info as ExtraInfoHandlerParamsInterface;
    if (!data.id) return;
    console.log("FILE_SENT received", data);
    transfersRef.current.delete(data.id);
    setTransfers(prev => prev.filter(t => t.id !== data.id));
    if (data.res) {
      toast.success("File received successfully!");
      return;
    }
    toast.error(`Error occurred while receiving a file`);
  };

  const dataChannelHandler = (event: RTCDataChannelEvent) => {
    const channel = event.channel;
    if (channel.label.startsWith("file-")) {
      const fileId = channel.label.slice(5);
      console.log(`[Receiver] Incoming file data channel for ${fileId}, readyState: ${channel.readyState}`);
      
      // Attach message listener IMMEDIATELY — don't wait for onopen!
      // This prevents data loss from race condition where sender sends before listener is attached.
      listenForFile(channel);

      // Update receiver-side transfer status to IN_PROGRESS
      const target = transfersRef.current.get(fileId);
      if (target && (target.current === "WAITING_FOR_DATACHANNEL" || target.current === "WAITING_FOR_RESPONSE")) {
        const updated = { ...target, current: "IN_PROGRESS" as TransferInterface["current"] };
        transfersRef.current.set(fileId, updated);
        setTransfers(prev => prev.map(t => t.id === fileId ? updated : t));
        useFileTransferStore.getState().updateStatus(fileId, "IN_PROGRESS");
      }

      // Also add the channel to the store so it's tracked (needed for pause/resume on host side)
      const addToStore = () => {
        useWebRTCConnectionStore.getState().setFileDataChannels(channel);
      };
      if (channel.readyState === "open") {
        addToStore();
      } else {
        channel.addEventListener("open", addToStore, { once: true });
      }
    }
  };

  useEffect(() => {
    if (!controlDatachannel) return;
    
    const cleanupMeta = listenForExtraInfo(controlDatachannel, EVENTS.META, listenForMetaEvent);
    const cleanupAck = listenForExtraInfo(
      controlDatachannel,
      EVENTS.METADATA_ACK,
      listenForMetaAckEvent,
    );
    const cleanupFileSent = listenForExtraInfo(controlDatachannel, EVENTS.FILE_SENT, listenForFileSentEvent);
    const cleanupCancel = listenForExtraInfo(
      controlDatachannel,
      EVENTS.FILE_TRANSFER_CANCELLED,
      listenForCancelTransferEvent,
    );
    const cleanupPause = listenForExtraInfo(
      controlDatachannel,
      EVENTS.FILE_PAUSE,
      listenForPauseTransferEvent,
    );
    const cleanupResume = listenForExtraInfo(
      controlDatachannel,
      EVENTS.FILE_RESUME,
      listenForResumeTransferEvent,
    );

    if (pc) {
      pc.addEventListener("datachannel", dataChannelHandler);
    }

    return () => {
        if (cleanupMeta) cleanupMeta();
        if (cleanupAck) cleanupAck();
        if (cleanupFileSent) cleanupFileSent();
        if (cleanupCancel) cleanupCancel();
        if (cleanupPause) cleanupPause();
        if (cleanupResume) cleanupResume();
        if (pc) {
          pc.removeEventListener("datachannel", dataChannelHandler);
        }
    };
  }, []);
}
