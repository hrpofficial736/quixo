import downloadBlob from "@/lib/downloadBlob";
import rtcManager from "@/services/rtcManager";
import { useFileTransferStore } from "@/stores/useFileTransferStore";
import { CustomObject } from "@/types/customObjectType";
import {
  ExtraInfoHandlerParamsInterface,
  FileTransferMetaDataRequestInterface,
} from "@/types/fileTransferInterfaces";
import { useCallback } from "react";
import toast from "react-hot-toast";

const { listenForDataChannelMessage } = rtcManager();

const receivedBuffers: Uint8Array<ArrayBuffer>[] = [];
let receivedSize: number = 0;
let fileMetaData: FileTransferMetaDataRequestInterface | null = null;

export default function useHandleFileTransfer() {
  const listenForFile = useCallback((dc: RTCDataChannel) => {
    return lff(dc);
  }, []);

  const listenForExtraInfo = useCallback(
    (
      dc: RTCDataChannel,
      eventName: string,
      handler: (
        info?:
          | FileTransferMetaDataRequestInterface
          | ExtraInfoHandlerParamsInterface,
      ) => void,
    ) => {
      return lfei(dc, eventName, handler);
    },
    [],
  );

  const sendFile = useCallback(
    (dc: RTCDataChannel, file: File, handler?: () => void) =>
      sf(dc, file, handler),
    [],
  );

  const sendExtraInfo = useCallback(
    (dc: RTCDataChannel, data: object) => sei(dc, data),
    [],
  );

  return {
    listenForFile,
    listenForExtraInfo,
    sendFile,
    sendExtraInfo,
  };
}

function lfei(
  dc: RTCDataChannel,
  eventName: string,
  handler?: (
    info?:
      | FileTransferMetaDataRequestInterface
      | ExtraInfoHandlerParamsInterface,
  ) => void,
) {
  console.log(`Setting up listener for: ${eventName}`);
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
      return;
    }

    const messageName = dataObject["name"];
    if (messageName !== eventName) {
      return;
    }

    console.log(`[${eventName}] Message received:`, dataObject);

    switch (eventName) {
      case "METADATA-ACK":
        // Check the actual response value
        const accepted = dataObject["res"] === "ACC";
        console.log(
          `[METADATA-ACK] Response: ${accepted ? "ACCEPTED" : "REJECTED"}`,
        );
        if (handler) handler({ res: accepted, id: dataObject["id"] });
        break;

      case "META":
        // Reset buffers for new file transfer
        receivedBuffers.length = 0;
        receivedSize = 0;

        toast.success("File transfer request received");
        fileMetaData = {
          id: dataObject["id"],
          name: dataObject["fileName"],
          size: Number.parseInt(dataObject["size"]),
          chunkSize: Number.parseInt(dataObject["chunkSize"]),
          mime: dataObject["mime"],
        };

        console.log("[META] File metadata received:", fileMetaData);
        if (handler) {
          handler(fileMetaData);
        }
        break;

      case "FILE_SENT":
        console.log("[FILE_SENT] Transfer complete signal received");
        console.log(
          `Expected: ${fileMetaData?.size}, Received: ${receivedSize}`,
        );

        if (!fileMetaData) {
          console.error("[FILE_SENT] File metadata is missing!");
          if (handler) handler({ res: false });
          return;
        }

        const isComplete = receivedSize === fileMetaData.size;
        const completedId = fileMetaData.id; // Capture ID

        if (receivedSize > 0 && isComplete && receivedBuffers.length > 0) {
          console.log("[FILE_SENT] Creating blob and downloading...");
          const blob = new Blob(receivedBuffers, { type: fileMetaData.mime });
          downloadBlob(blob, fileMetaData.name);

          receivedBuffers.length = 0;
          receivedSize = 0;
          fileMetaData = null;

          if (handler) handler({ res: true, id: completedId });
        } else {
          console.error(
            `[FILE_SENT] File incomplete! Expected: ${fileMetaData.size}, Got: ${receivedSize}`,
          );
          if (handler) handler({ res: false, id: completedId });
        }
        break;
    }
  });
}

function sei(dc: RTCDataChannel, data: object) {
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

  console.log("[SEND INFO] Sending:", data);
  dc.send(JSON.stringify(data));
}

function lff(dc: RTCDataChannel) {
  let lastProgressUpdate = 0;
  return listenForDataChannelMessage(dc, async (event) => {
    if (event.data instanceof ArrayBuffer) {
      const chunk = new Uint8Array(event.data);
      receivedBuffers.push(chunk);
      receivedSize += chunk.byteLength;
    } else if (event.data instanceof Blob) {
      const buffer = await event.data.arrayBuffer();
      if (!buffer) {
        console.error("No buffer found!");
        return;
      }

      const chunk = new Uint8Array(buffer);
      receivedBuffers.push(chunk);
      receivedSize += chunk.byteLength;
    } else {
      console.log("non-binary message, skipping...");
    }
    if (fileMetaData) {
      const now = Date.now();
      if (now - lastProgressUpdate > 50 || receivedSize === fileMetaData.size) {
        useFileTransferStore
          .getState()
          .setProgress((receivedSize / fileMetaData!.size) * 100);
        lastProgressUpdate = now;
      }
    }
  });
}

async function sf(dc: RTCDataChannel, file: File, onComplete?: () => void) {
  if (!dc) {
    console.error("[SEND FILE] No data channel found!");
    return;
  }

  if (!file) {
    console.error("[SEND FILE] No file found!");
    return;
  }

  if (dc.readyState !== "open") {
    console.error(
      "[SEND FILE] Data channel is not open! State:",
      dc.readyState,
    );
    return;
  }

  console.log(
    "[SEND FILE] Starting transfer for:",
    file.name,
    "size:",
    file.size,
  );

  const stream = file.stream();
  const reader = stream.getReader();

  let offset = 0;
  let lastProgressUpdate = 0;

  try {
    while (true) {
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
        useFileTransferStore.getState().setProgress((offset / file.size) * 100);
        lastProgressUpdate = now;
      }
    }

    if (offset === file.size) {
      console.log("[SEND FILE] Transfer complete! Sending FILE_SENT");
      sei(dc, { name: "FILE_SENT", message: "File sent successfully!" });
      if (onComplete) onComplete();
    } else {
      console.error(
        `[SEND FILE] Transfer incomplete: ${offset}/${file.size} bytes`,
      );
      sei(dc, { name: "FILE_SENT", message: "File transfer incomplete!" });
    }
  } catch (error) {
    console.error("[SEND FILE] Error during transfer:", error);
  } finally {
    reader.releaseLock();
  }
}
