"use client";

import Window from "@/components/Window";
import { poppins } from "../fonts";
import { useEffect, useState } from "react";
import DeviceNamePrompt from "../components/DeviceNamePrompt";
import useNextDestFromLandingPage from "@/hooks/useNextDestFromLandingPage";
import { useParams } from "next/navigation";
import LoadingPage from "@/components/LoadingPage";
import { useConnectionStatusStore } from "@/stores/useConnectionStatusStore";
import toast from "react-hot-toast";
import { useUserStore } from "@/stores/useUserStore";
import TransferWindow from "../components/TransferWindow";

export default function TransferPage() {
  const [pageToShow, setPageToShow] = useState<
    "LOADING" | "NAME_PROMPT" | "TRANSFER"
  >("LOADING");

  const status = useConnectionStatusStore((state) => state.status);
  useEffect(() => {
    const checkWhichPageToShow = () => {
      if (status !== "CONNECTED") {
        setPageToShow("NAME_PROMPT");
        return;
      }
      setPageToShow("TRANSFER");
    };

    checkWhichPageToShow();
  }, [status]);

  const { id } = useParams();

  const { navigateToTransferWindow, pair } = useNextDestFromLandingPage();

  const handlePair = (id: string, name: string) => pair(id, name);

  useEffect(() => {
    const executeNavigationToTransferWindow = () => {
      if (navigateToTransferWindow) {
        toast.success(
          "Your device is connected with " +
            useUserStore.getState().otherDeviceName,
        );
        setPageToShow("TRANSFER");
      }
    };
    executeNavigationToTransferWindow();
  }, [navigateToTransferWindow]);

  if (pageToShow === "LOADING") return <LoadingPage />;
  else if (pageToShow === "NAME_PROMPT")
    return (
      <div
        className={`w-screen h-screen f-c-row bg-bgPrimary ${poppins.className}`}
      >
        <DeviceNamePrompt
          onSubmit={(name: string) => {
            handlePair(id as string, name);
          }}
        />
      </div>
    );
  return (
    <div
      className={`w-screen h-screen ${poppins.className} bg-bgPrimary f-c-row`}
    >
      <TransferWindow onClose={() => {}} isOpen={pageToShow === "TRANSFER"} />
    </div>
  );
}
