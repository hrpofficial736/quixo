"use client";

import Window from "@/components/Window";
import { useState } from "react";
import ConnectionOptions from "./ConnectionOptions";
import DeviceNamePrompt from "./DeviceNamePrompt";
import getRedirectUrl from "@/lib/redirectUrlHelper";
import socketManager from "@/services/socketManager";
import { useAppSocket } from "@/context/SocketContext";
import toast from "react-hot-toast";

export default function ConnectionWindow({
  isOpen,
  onCloseAction,
}: {
  isOpen: boolean;
  onCloseAction: () => void;
}) {
  const [proceedToConnectionOptions, setProceedToConnectionOptions] =
    useState<boolean>(false);

  const [redirectUrl, setRedirectUrl] = useState<string>("");

  const { emitEvent, listenEvent } = socketManager();

  const socket = useAppSocket();

  const sendReadyToPairDeviceEventToSignalingServer = (data: object) => {
    emitEvent(socket!, "ready_to_pair", data);
  };

  const handleNameSubmit = (name: string) => {
    const { url, pairingId } = getRedirectUrl(name);
    setRedirectUrl(url);
    sendReadyToPairDeviceEventToSignalingServer({
      deviceName: name,
      redirectUrl: url,
      status: "WAITING",
      pairingId,
    });
    listenEvent(socket!, (params) => {
      if (params.eventName === "ready_to_pair") {
        if (params.success) {
          toast.success("Your device is ready to be paired.");
          setProceedToConnectionOptions(true);
          return;
        }
        toast.error("Error pairing your device, please try again");
      }
    });

    listenEvent(socket!, (params) => {
      if (params.eventName === "request_to_pair") {
      }
    });
  };

  return (
    <>
      {isOpen && (
        <Window
          onClose={onCloseAction}
          header="Connect"
          extraClass="w-[80%] h-[600px]"
        >
          {proceedToConnectionOptions ? (
            <ConnectionOptions url={redirectUrl} />
          ) : (
            <DeviceNamePrompt onSubmit={handleNameSubmit} />
          )}
        </Window>
      )}
    </>
  );
}
