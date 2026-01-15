"use client";

import Window from "@/components/Window";
import { useEffect, useState } from "react";
import ConnectionOptions from "./ConnectionOptions";
import DeviceNamePrompt from "./DeviceNamePrompt";
import toast from "react-hot-toast";
import useInitializeConnection from "@/hooks/useInitializeConnection";
import { useUserStore } from "@/stores/useUserStore";
import { AnimatePresence, motion } from "motion/react";

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
  const initializeConnectionHandler = async (name: string) => {
    const res = await fetch("/api/id", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const { url, pairingId } = await res.json();
    setUser({ deviceName: name });
    setRedirectUrl(url);
    setProceedToConnectionOptions(true);
    execute({
      deviceName: name,
      redirectUrl: url,
      pairingId,
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
    <AnimatePresence>
      {isOpen && (
        <Window
          showClose={true}
          onClose={onCloseAction}
          header="Connect"
          extraClass="w-[80%]"
        >
          <AnimatePresence mode="wait">
            {proceedToConnectionOptions ? (
              <motion.div
                key={"options"}
                initial={{
                  x: 200,
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  x: -200,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.3,
                }}
                className="w-full h-full"
              >
                <ConnectionOptions url={redirectUrl} />
              </motion.div>
            ) : (
              <motion.div
                key={"prompt"}
                exit={{
                  x: -200,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.1,
                }}
                className="w-full h-full"
              >
                <DeviceNamePrompt onSubmit={initializeConnectionHandler} />
              </motion.div>
            )}
          </AnimatePresence>
        </Window>
      )}
    </AnimatePresence>
  );
}
