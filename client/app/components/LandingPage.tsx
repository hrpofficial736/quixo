"use client";

import { useState } from "react";
import Header from "./Header";
import ConnectionWindow from "./ConnectionWindow";
import { poppins } from "../fonts";

export default function LandingPage() {
  const [isConnectionWindowOpen, setIsConnectionWindowOpen] =
    useState<boolean>(false);

  const handleToggleConnectionWindow = () =>
    setIsConnectionWindowOpen(!isConnectionWindowOpen);
  return (
    <div className={`w-screen h-screen bg-bgPrimary ${poppins.className}`}>
      <Header onTrigger={handleToggleConnectionWindow} />
      <ConnectionWindow
        onTrigger={handleToggleConnectionWindow}
        isOpen={isConnectionWindowOpen}
      />
    </div>
  );
}
