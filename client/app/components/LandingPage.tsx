"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import ConnectionWindow from "./ConnectionWindow";
import { poppins } from "../fonts";
import { useSearchParams } from "next/navigation";
import LoadingPage from "@/components/LoadingPage";
import { useAppSocket } from "@/context/SocketContext";
import useSocket from "@/hooks/useSocket";
import toast from "react-hot-toast";
import TransferWindow from "./TransferWindow";

export default function LandingPage() {
  const params = useSearchParams();
  const [showHome, setShowHome] = useState<boolean>(params.size === 0);
  const [showTransferWindow, setShowTransferWindow] = useState<boolean>(false);
  const [isConnectionWindowOpen, setIsConnectionWindowOpen] =
    useState<boolean>(false);
  const socket = useAppSocket();
  const { emitEvent, listenEvent } = useSocket();
  const handleToggleConnectionWindow = () =>
    setIsConnectionWindowOpen(!isConnectionWindowOpen);

  useEffect(() => {
    if (!showHome && socket && params.size > 0) {
      emitEvent(socket!, "request_to_pair", {
        deviceName: params.get("name"),
        redirectUrl: window.location.href,
        status: params.get("status"),
        pairingId: params.get("pairing_id"),
      });
      listenEvent(socket!, (params) => {
        if (params.eventName === "request_to_pair") {
          if (params.success) {
            toast.success(
              "You are paired with the device" +
                " " +
                params.data["deviceName"],
            );
            setShowTransferWindow(true);
            setShowHome(true);
            return;
          }
          toast.error("Error pairing with device: " + params.message);
        }
      });
    }
  }, [socket]);
  if (!showHome) return <LoadingPage />;
  return (
    <div className={`w-screen h-screen bg-bgPrimary ${poppins.className}`}>
      <Header onTrigger={handleToggleConnectionWindow} />
      <ConnectionWindow
        onCloseAction={handleToggleConnectionWindow}
        isOpen={isConnectionWindowOpen}
      />
      <TransferWindow
        isOpen={showTransferWindow}
        onClose={() => setShowTransferWindow(false)}
      />
    </div>
  );
}
