"use client";

import Window from "@/components/Window";
import { useState } from "react";
import ConnectionOptions from "./ConnectionOptions";
import DeviceNamePrompt from "./DeviceNamePrompt";
import getRedirectUrl from "@/lib/redirectUrlHelper";
import useSocket from "@/hooks/useSocket";
import toast from "react-hot-toast";

export default function ConnectionWindow({
  isOpen,
  onTrigger,
}: {
  isOpen: boolean;
  onTrigger: () => void;
}) {
  const [proceedToConnectionOptions, setProceedToConnectionOptions] =
    useState<boolean>(false);
  const [redirectUrl, setRedirectUrl] = useState<string>("");

  const { getSocket, emitEvent } = useSocket();

  const sendReadyToPairDeviceEventToSignalingServer = (data: object) => {
    const socket = getSocket();
    emitEvent(
      socket,
      "ready_to_pair",
      data,
      (success: boolean, message: string) => {
        if (success) {
          toast.success(message);
        } else toast.error(message);
      },
    );
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
    setProceedToConnectionOptions(true);
  };
  return (
    <>
      {isOpen && (
        <Window
          onClose={onTrigger}
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
