"use client";

import { useState } from "react";
import Header from "./Header";
import ConnectionWindow from "./ConnectionWindow";
import { poppins } from "../fonts";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/useUserStore";
import { useConnectionStatusStore } from "@/stores/useConnectionStatusStore";
import { useAppSocket } from "@/context/SocketContext";
import LoadingPage from "@/components/LoadingPage";

export default function LandingPage() {
  const router = useRouter();
  const [isConnectionWindowOpen, setIsConnectionWindowOpen] =
    useState<boolean>(false);

  const handleToggleConnectionWindow = () =>
    setIsConnectionWindowOpen(!isConnectionWindowOpen);

  const navigateToTransferWindowTrigger = () => {
    const id = useUserStore.getState().pairingId;
    setIsConnectionWindowOpen(false);
    useConnectionStatusStore.getState().setStatus("CONNECTED");
    router.push(`/${id}`);
  };

  const socket = useAppSocket();

  if (!socket || !socket.OPEN) return <LoadingPage />

  return (
    <div className={`w-screen h-screen bg-bgPrimary ${poppins.className}`}>
      <div
        className={`w-full h-full ${isConnectionWindowOpen ? "blur-xl" : "blur-none"}`}
      >
        <Header onTrigger={handleToggleConnectionWindow} />
      </div>
      <ConnectionWindow
        onCloseAction={handleToggleConnectionWindow}
        navigateToTransferWindow={navigateToTransferWindowTrigger}
        isOpen={isConnectionWindowOpen}
      />
    </div>
  );
}
