import downloadBlob from "@/lib/downloadBlob";
import rtcManager from "@/services/rtcManager";
import { useFileTransferStore } from "@/stores/useFileTransferStore";
import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";
import { CustomObject } from "@/types/customObjectType";
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
  let lastProgressUpdate = 0;
  return listenForDataChannelMessage(dc, async (event) => {
    if (dc.label === "control") return;
    const fileId = dc.label.startsWith("file-") ? dc.label.slice(5) : dc.label;
    const file = activeTransfers.get(fileId);
    if (!file) {
      console.error("No such file found!");
      return;
    }
    if (event.data instanceof ArrayBuffer) {
      console.log("Received chunk", event.data.byteLength);
      const chunk = new Uint8Array(event.data);
      file.receivedBuffers.push(chunk);
      file.receivedSize += chunk.byteLength;
    } else if (event.data instanceof Blob) {
      console.log("Received blob of size", event.data.size);
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
        (now - lastProgressUpdate > 50 || file.receivedSize === file.fileMetadata.size)
      ) {
        useFileTransferStore
          .getState()
          .updateProgress(file.fileMetadata.id, (file.receivedSize / file.fileMetadata.size) * 100);
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

    let dataObject: CustomObject;
    try {
      dataObject = JSON.parse(event.data);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return;
    }

    const messageName = dataObject["name"];
    const fileId = dataObject["id"];
    if (messageName !== eventName) {
      return;
    }

    switch (eventName) {
      case "METADATA-ACK":
        // Check the actual response value
        const accepted = dataObject["res"] === "ACC";

        if (handler) handler({ res: accepted, id: dataObject["id"] });
        break;

      case "FILE_TRANSFER_CANCELLED":
        if (handler) handler({ id: dataObject["id"], res: true });
        break;

      case "META":
        // Reset buffers for new file transfer
        if (!fileId) return;

        const fileMetadata = {
          id: fileId,
          name: dataObject["fileName"],
          size: Number.parseInt(dataObject["size"]),
          chunkSize: Number.parseInt(dataObject["chunkSize"]),
          mime: dataObject["mime"],
        };

        const isResume = !!dataObject["resume"];

        if (isResume && activeTransfers.has(fileId)) {
          console.log(
            `[META] Resuming file ${fileId}. Keeping existing buffer.`,
          );
          // Update metadata to ensure freshness
          const active = activeTransfers.get(fileId);
          if (active) active.fileMetadata = fileMetadata;
        } else {
          console.log(`[META] New file ${fileId}. Resetting buffer.`);
          activeTransfers.set(fileId, {
            fileMetadata,
            receivedBuffers: [],
            receivedSize: 0,
          });
        }
        
        // Sync with store
        useFileTransferStore.getState().addFile(fileMetadata);

        if (handler) {
          handler(fileMetadata);
        }
        break;

      case "FILE_SENT":
        console.log(fileId);
        const fileMeta = activeTransfers.get(fileId)?.fileMetadata;
        if (!fileMeta) {
          console.error("[FILE_SENT] File metadata is missing!");
          if (handler) handler({ res: false });
          return;
        }
        const receivedBuffers = activeTransfers.get(fileId)?.receivedBuffers;
        if (!receivedBuffers) {
          console.error("[FILE_SENT] Received buffers are missing!");
          if (handler) handler({ res: false });
          return;
        }

        const receivedSize = activeTransfers.get(fileId)?.receivedSize;
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

      case "FILE_PAUSE":
        console.log("FILE_PAUSE event called!");
        if (handler) handler({ id: fileId, res: true });
        break;

      case "FILE_RESUME":
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

  if (dc.readyState !== "open") {
    console.error(
      "[SEND FILE] Data channel is not open! State:",
      dc.readyState,
    );
    return startOffset;
  }

  // Use startOffset to slice file
  const stream = file.slice(startOffset).stream();
  const reader = stream.getReader();

  let offset = startOffset;
  let lastProgressUpdate = 0;

  try {
    while (true) {
      if (signal?.aborted) {
        console.log(
          "[SEND FILE] Transfer aborted/paused by user at offset:",
          offset,
        );
        return offset; // Return current offset
      }

      if (dc.bufferedAmount > 64 * 1024) {
        await new Promise((r) => setTimeout(r, 10));
        continue;
      }

      const { done, value } = await reader.read();
      if (done) break;

      if (dc.readyState !== "open") {
        console.error("[SEND FILE] Data channel closed during transfer!");
        break;
      }

      // Create proper ArrayBuffer slice (value.buffer might have wrong offset)
      const buffer = value.buffer.slice(
        value.byteOffset,
        value.byteOffset + value.byteLength,
      );
      dc.send(buffer);
      offset += value.byteLength;

      const now = Date.now();
      if (now - lastProgressUpdate > 50 || offset === file.size) {
        const cleanId = dc.label.startsWith("file-") ? dc.label.slice(5) : dc.label;
        useFileTransferStore.getState().updateProgress(cleanId, (offset / file.size) * 100);
        lastProgressUpdate = now;
      }
    }

    // Get Control Channel for Signaling
    const controlDataChannel =
      useWebRTCConnectionStore.getState().controlDatachannel;

    if (offset === file.size) {
      console.log("[SEND FILE] Transfer complete! Sending FILE_SENT");
      if (controlDataChannel) {
        // Extract ID from label (file-ID -> ID)
        const cleanId = dc.label.startsWith("file-")
          ? dc.label.slice(5)
          : dc.label;
        sendExtraInfo(controlDataChannel, {
          name: "FILE_SENT",
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
  } finally {
    reader.releaseLock();
  }
  return offset;
}
