"use client";

import { useEffect, useState } from "react";
import ConnectionOptions from "./ConnectionOptions";
import DeviceNamePrompt from "./DeviceNamePrompt";
import toast from "react-hot-toast";
import useInitializeConnection from "@/hooks/useInitializeConnection";
import { useUserStore } from "@/stores/useUserStore";
import { AnimatePresence, motion } from "motion/react";
import { FiX } from "react-icons/fi";

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
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed z-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-md:px-4"
        >
          <div className="bg-bgSecondary border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-textPrimary">
                Connect
              </h2>
              <button
                onClick={onCloseAction}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-textTertiary hover:text-textPrimary transition-all cursor-pointer"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {proceedToConnectionOptions ? (
                <motion.div
                  key="options"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ConnectionOptions url={redirectUrl} />
                </motion.div>
              ) : (
                <motion.div
                  key="prompt"
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                >
                  <DeviceNamePrompt onSubmit={initializeConnectionHandler} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
