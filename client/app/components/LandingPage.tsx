"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import ConnectionWindow from "./ConnectionWindow";
import { poppins } from "../fonts";
import { useSearchParams } from "next/navigation";
import LoadingPage from "@/components/LoadingPage";
import TransferWindow from "./TransferWindow";

export default function LandingPage() {
  const params = useSearchParams();
  const [showHome, setShowHome] = useState<boolean>(params.size === 0);
  const [showTransferWindow, setShowTransferWindow] = useState<boolean>(false);
  const [isConnectionWindowOpen, setIsConnectionWindowOpen] =
    useState<boolean>(false);

  const handleToggleConnectionWindow = () =>
    setIsConnectionWindowOpen(!isConnectionWindowOpen);

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
