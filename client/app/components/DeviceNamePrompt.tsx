"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { FiMonitor, FiArrowRight } from "react-icons/fi";

export default function DeviceNamePrompt({
  onSubmit,
}: {
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = () => {
    setLoading(true);
    if (name.trim() === "") {
      toast.error("Please enter your device name first!");
      setLoading(false);
      return;
    }
    onSubmit(name);
    setLoading(false);
  };

  return (
    <div className="px-5 py-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-textSecondary">
        <FiMonitor size={16} />
        <p className="text-sm">
          Give your device a display name
        </p>
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className="w-full bg-white/[0.04] border border-white/[0.08] text-textPrimary text-sm font-medium focus:outline-none focus:border-white/20 rounded-lg px-4 py-3 placeholder-textTertiary transition-colors"
        placeholder="e.g. MacBook Pro"
        autoFocus
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] ${
          loading
            ? "bg-white/10 text-textTertiary cursor-not-allowed"
            : "bg-white text-bgPrimary hover:bg-white/90"
        }`}
      >
        {loading ? (
          "Connecting..."
        ) : (
          <>
            Continue
            <FiArrowRight size={14} />
          </>
        )}
      </button>
    </div>
  );
}
