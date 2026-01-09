"use client";

import Window from "@/components/Window";
import { useEffect, useState } from "react";
import ConnectionOptions from "./ConnectionOptions";
import DeviceNamePrompt from "./DeviceNamePrompt";
import getRedirectUrl from "@/lib/redirectUrlHelper";
import toast from "react-hot-toast";
import useInitializeConnection from "@/hooks/useInitializeConnection";
import { useUserStore } from "@/stores/useUserStore";

export default function ConnectionWindow({
  isOpen,
  onCloseAction,
  navigateToTransferWindow,
}: {
  isOpen: boolean;
  onCloseAction: () => void;
  navigateToTransferWindow: () => void;
}) {
  const [proceedToConnectionOptions, setProceedToConnectionOptions] =
    useState<boolean>(false);

  const [redirectUrl, setRedirectUrl] = useState<string>("");
  const { setUser } = useUserStore();
  const { execute, readyToPair, connected } = useInitializeConnection();
  const initializeConnectionHandler = (name: string) => {
    const { url, pairingId } = getRedirectUrl(name);
    setUser({ deviceName: name });
    setRedirectUrl(url);
    console.log(url);
    setProceedToConnectionOptions(true);
    execute({
      deviceName: name,
      redirectUrl: url,
      pairingId,
      status: "WAITING",
    });
  };

  useEffect(() => {
    const checkIfPaired = () => {
      if (readyToPair === "READY_TO_PAIR") {
        setProceedToConnectionOptions(true);
        toast.success("Your device is ready to be paired");
      } else if (readyToPair === "FAILED") {
        toast.loading("Some error occured, please try again");
      }
    };
    checkIfPaired();
  }, [readyToPair]);

  useEffect(() => {
    if (connected) {
      toast.success(
        "You are successfully connected with " +
          useUserStore.getState().otherDeviceName,
      );
      navigateToTransferWindow();
    }
  }, [connected]);

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
            <DeviceNamePrompt onSubmit={initializeConnectionHandler} />
          )}
        </Window>
      )}
    </>
  );
}
