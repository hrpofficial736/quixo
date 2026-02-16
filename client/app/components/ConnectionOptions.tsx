"use client";

import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import QRCode from "react-qr-code";

export default function ConnectionOptions({ url }: { url: string }) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    setCopied(true);
    await navigator.clipboard.writeText(url);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-5 py-6 flex flex-col items-center gap-5">
      {/* QR Code */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-textSecondary font-medium">
          Scan on the other device
        </p>
        <div className="p-4 bg-white rounded-xl">
          <QRCode value={url} size={160} className="max-sm:w-32 max-sm:h-32" />
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="text-xs text-textTertiary font-medium">or share link</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>

      {/* Link copy */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 overflow-hidden">
          <p className="text-xs text-textSecondary font-mono truncate">
            {url}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            copied
              ? "bg-success/10 text-success border border-success/20"
              : "bg-white/[0.06] text-textSecondary border border-white/[0.08] hover:bg-white/10"
          }`}
        >
          {copied ? (
            <>
              <FiCheck size={13} />
              Copied
            </>
          ) : (
            <>
              <FiCopy size={13} />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Waiting indicator */}
      <div className="flex items-center gap-2 py-2">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-textTertiary animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-textTertiary animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-textTertiary animate-bounce [animation-delay:300ms]" />
        </div>
        <span className="text-xs text-textTertiary">
          Waiting for peer to connect...
        </span>
      </div>
    </div>
  );
}
