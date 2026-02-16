import downloadBlob from "@/lib/downloadBlob";
import { EVENTS } from "@/lib/events";
import rtcManager from "@/services/rtcManager";
import { useFileTransferStore } from "@/stores/useFileTransferStore";
import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";
import {
  ExtraInfoHandlerParamsInterface,
  FileTransferMetaDataRequestInterface,
} from "@/types/fileTransferInterfaces";

const { listenForDataChannelMessage } = rtcManager();

type ActiveTransfer = {
  receivedBuffers: Uint8Array<ArrayBuffer>[];
  receivedSize: number;
  fileMetadata: FileTransferMetaDataRequestInterface | null;
};

// Module-level state for active transfers
const activeTransfers: Map<string, ActiveTransfer> = new Map<
  string,
  ActiveTransfer
>();

/**
 * Listen for File (lff)
 */
export function listenForFile(dc: RTCDataChannel) {
  console.log(`[listenForFile] CALLED for channel: ${dc.label}, readyState: ${dc.readyState}`);
  let lastProgressUpdate = 0;
  return listenForDataChannelMessage(dc, async (event) => {
    if (dc.label === "control") return;
    const fileId = dc.label.startsWith("file-") ? dc.label.slice(5) : dc.label;
    const file = activeTransfers.get(fileId);
    if (!file) {
      console.error(`[ListenForFile] No active transfer found for ID: ${fileId}. Label: ${dc.label}`);
      console.log("[ListenForFile] Current active transfers:", Array.from(activeTransfers.keys()));
      return;
    }
    if (event.data instanceof ArrayBuffer) {
      const chunk = new Uint8Array(event.data);
      file.receivedBuffers.push(chunk);
      file.receivedSize += chunk.byteLength;
    } else if (event.data instanceof Blob) {
      const buffer = await event.data.arrayBuffer();
      if (!buffer) {
        console.error("No buffer found!");
        return;
      }

      const chunk = new Uint8Array(buffer);
      file.receivedBuffers.push(chunk);
      file.receivedSize += chunk.byteLength;
    }
    if (file.fileMetadata) {
      const now = Date.now();
      if (
        file.fileMetadata &&
        file.fileMetadata.id &&
        (now - lastProgressUpdate > 50 ||
          file.receivedSize === file.fileMetadata.size)
      ) {
        useFileTransferStore
          .getState()
          .updateProgress(
            file.fileMetadata.id,
            (file.receivedSize / file.fileMetadata.size) * 100,
          );
        lastProgressUpdate = now;
      }
    }
  });
}

/**
 * Send Extra Info (sei)
 */
export function sendExtraInfo(dc: RTCDataChannel, data: object) {
  if (!dc) {
    console.error("[SEND INFO] No data channel found!");
    return;
  }

  if (!data) {
    console.error("[SEND INFO] No data found!");
    return;
  }

  if (dc.readyState !== "open") {
    console.error(
      "[SEND INFO] Data channel is not open! State:",
      dc.readyState,
    );
    return;
  }

  dc.send(JSON.stringify(data));
}

/**
 * Listen for Extra Info (lfei)
 */
export function listenForExtraInfo(
  dc: RTCDataChannel,
  eventName: string,
  handler?: (
    info?:
      | FileTransferMetaDataRequestInterface
      | ExtraInfoHandlerParamsInterface,
  ) => void,
) {
  return listenForDataChannelMessage(dc, (event) => {
    if (!event) {
      console.error("No event found!");
      return;
    }

    if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
      return;
    }

    const dataObject = JSON.parse(event.data);
    
    // Filter: Only process if the message name matches the event we are listening for
    if (dataObject["eventName"] !== eventName) return;

    const fileId = dataObject["id"];

    switch (eventName) {
      case EVENTS.METADATA_ACK:
        // Check the actual response value
        const accepted = dataObject["res"] === "ACC";

        if (handler) handler({ res: accepted, id: dataObject["id"] });
        break;

      case EVENTS.FILE_TRANSFER_CANCELLED:
        console.log("FILE_TRANSFER_CANCELLED received");
        if (handler) handler({ id: dataObject["id"], res: true });
        break;

      case EVENTS.META:
        if (!fileId) return;

        const fileMetadata = dataObject as FileTransferMetaDataRequestInterface;

        console.log(`[META] New file ${fileId}`);
        activeTransfers.set(fileId, {
          fileMetadata,
          receivedBuffers: [],
          receivedSize: 0,
        });

        useFileTransferStore.getState().addFile(fileMetadata);

        if (handler) {
          handler(fileMetadata);
        }
        break;

      case EVENTS.FILE_SENT:
        console.log(`[FILE_SENT] File ${fileId}`);
        const transfer = activeTransfers.get(fileId);
        if (!transfer) return;
        const fileMeta = transfer.fileMetadata;
        if (!fileMeta) {
          console.error("[FILE_SENT] File metadata is missing!");
          if (handler) handler({ res: false });
          return;
        }
        const receivedBuffers = transfer.receivedBuffers;
        if (!receivedBuffers) {
          console.error("[FILE_SENT] Received buffers are missing!");
          if (handler) handler({ res: false });
          return;
        }

        const receivedSize = transfer.receivedSize;
        if (!receivedSize) {
          console.error("[FILE_SENT] Received size is missing!");
          if (handler) handler({ res: false });
          return;
        }

        const isComplete = receivedSize === fileMeta.size;
        const completedId = fileMeta.id; // Capture ID

        if (receivedSize > 0 && isComplete && receivedBuffers.length > 0) {
          const blob = new Blob(receivedBuffers, { type: fileMeta.mime });
          downloadBlob(blob, fileMeta.name);

          activeTransfers.delete(fileId);

          if (handler) handler({ res: true, id: completedId });
        } else {
          console.error(
            `[FILE_SENT] File incomplete! Expected: ${fileMeta.size}, Got: ${receivedSize}`,
          );
          if (handler) handler({ res: false, id: completedId });
        }
        break;

      case EVENTS.FILE_PAUSE:
        console.log(`[FILE_PAUSE] File ${fileId}`);
        if (handler) handler({ id: fileId, res: true });
        break;

      case EVENTS.FILE_RESUME:
        console.log(`[FILE_RESUME] File ${fileId}`);
        if (handler) handler({ id: fileId, res: true });
        break;
    }
  });
}

/**
 * Send File (sf)
 */
export async function sendFile(
  dc: RTCDataChannel,
  file: File,
  startOffset: number = 0,
  signal?: AbortSignal,
  onComplete?: () => void,
): Promise<number> {
  if (!dc) {
    console.error("[SEND FILE] No data channel found!");
    return startOffset;
  }

  if (!file) {
    console.error("[SEND FILE] No file found!");
    return startOffset;
  }

  console.log(`[SEND FILE] Starting send on channel: ${dc.label}, readyState: ${dc.readyState}, fileSize: ${file.size}, startOffset: ${startOffset}`);

  if (dc.readyState !== "open") {
    console.error(
      "[SEND FILE] Data channel is not open! State:",
      dc.readyState,
    );
    return startOffset;
  }

  const CHUNK_SIZE = 16384; // 16KB — safe for SCTP max message size
  let offset = startOffset;
  let lastProgressUpdate = 0;
  const cleanId = dc.label.startsWith("file-") ? dc.label.slice(5) : dc.label;

  try {
    while (offset < file.size) {
      if (signal?.aborted) {
        console.log(
          "[SEND FILE] Transfer aborted/paused by user at offset:",
          offset,
        );
        // Save offset SYNCHRONOUSLY so resume can read it immediately
        useFileTransferStore.getState().setOffset(cleanId, offset);
        return offset;
      }

      // Back-pressure: wait if too much data is buffered
      while (dc.bufferedAmount > 64 * 1024) {
        if (signal?.aborted) {
          console.log("[SEND FILE] Abort detected during back-pressure wait at offset:", offset);
          useFileTransferStore.getState().setOffset(cleanId, offset);
          return offset;
        }
        await new Promise((r) => setTimeout(r, 10));
      }

      if (dc.readyState !== "open") {
        console.error("[SEND FILE] Data channel closed during transfer!");
        break;
      }

      // Read a fixed-size chunk from the file
      const end = Math.min(offset + CHUNK_SIZE, file.size);
      const chunk = await file.slice(offset, end).arrayBuffer();
      dc.send(chunk);
      
      offset = end;

      const now = Date.now();
      if (now - lastProgressUpdate > 50 || offset === file.size) {
        useFileTransferStore
          .getState()
          .updateProgress(cleanId, (offset / file.size) * 100);
        lastProgressUpdate = now;
      }
    }

    // Get Control Channel for Signaling
    const controlDataChannel =
      useWebRTCConnectionStore.getState().controlDatachannel;

    if (offset === file.size) {
      // Wait for all buffered data to actually be transmitted before signaling completion.
      // Without this, FILE_SENT (sent via control channel) arrives at the receiver
      // before the file data (sent via file channel) finishes transmitting.
      while (dc.bufferedAmount > 0) {
        await new Promise((r) => setTimeout(r, 50));
      }
      console.log("[SEND FILE] Buffer drained, sending FILE_SENT");
      if (controlDataChannel) {
        // Extract ID from label (file-ID -> ID)
        const cleanId = dc.label.startsWith("file-")
          ? dc.label.slice(5)
          : dc.label;
        sendExtraInfo(controlDataChannel, {
          eventName: "FILE_SENT",
          id: cleanId,
          message: "File sent successfully!",
          res: true,
        });
      }
      if (onComplete) onComplete();
    } else {
      console.error(
        `[SEND FILE] Transfer incomplete: ${offset}/${file.size} bytes`,
      );
    }
  } catch (error) {
    console.error("[SEND FILE] Error during transfer:", error);
  }
  return offset;
}
