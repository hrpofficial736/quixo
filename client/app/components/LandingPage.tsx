"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import ConnectionWindow from "./ConnectionWindow";
import { poppins } from "../fonts";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import LoadingPage from "@/components/LoadingPage";
import TransferWindow from "./TransferWindow";
import DeviceNamePrompt from "./DeviceNamePrompt";
import useNextDestFromLandingPage from "@/hooks/useNextDestFromLandingPage";
import toast from "react-hot-toast";

export default function LandingPage() {
  const params = useSearchParams();
  const [pageToShow, setPageToShow] = useState<string>("LOADING");
  const [showTransferWindow, setShowTransferWindow] = useState<boolean>(false);
  const [isConnectionWindowOpen, setIsConnectionWindowOpen] =
    useState<boolean>(false);

  const handleToggleConnectionWindow = () =>
    setIsConnectionWindowOpen(!isConnectionWindowOpen);

  const navigateToTransferWindowTrigger = () => setShowTransferWindow(true);
  const { navigateToTransferWindow, pair } = useNextDestFromLandingPage();

  const handlePair = (params: ReadonlyURLSearchParams, name: string) =>
    pair(params, name);
  useEffect(() => {
    if (navigateToTransferWindow) {
      toast.success(
        "Your device is successfully paired with the device" +
          params.get("name"),
      );
      setShowTransferWindow(true);
    }
  }, [navigateToTransferWindow]);

  useEffect(() => {
    if (params.size > 0 && !showTransferWindow) {
      setPageToShow("DEVICE_NAME_PROMPT");
    }
    if (params.size === 0) {
      setPageToShow("HOME");
    }
  }, [pageToShow]);

  if (pageToShow === "LOADING") return <LoadingPage />;
  else if (pageToShow === "DEVICE_NAME_PROMPT")
    return (
      <div className="w-screen h-screen f-c-row bg-bgPrimary">
        <DeviceNamePrompt
          onSubmit={(name: string) => {
            handlePair(params, name);
          }}
        />
      </div>
    );

  return (
    <div className={`w-screen h-screen bg-bgPrimary ${poppins.className}`}>
      <Header onTrigger={handleToggleConnectionWindow} />
      <ConnectionWindow
        onCloseAction={handleToggleConnectionWindow}
        navigateToTransferWindow={navigateToTransferWindowTrigger}
        isOpen={isConnectionWindowOpen}
      />
      <TransferWindow
        isOpen={showTransferWindow}
        onClose={() => setShowTransferWindow(false)}
      />
    </div>
  );
}
