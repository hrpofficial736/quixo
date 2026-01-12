"use client";

import { useState } from "react";
import { MdOutlineContentCopy } from "react-icons/md";
import { MdDone } from "react-icons/md";
import QRCode from "react-qr-code";
export default function ConnectionOptions({ url }: { url: string }) {
  const [copied, setCopied] = useState<boolean>(false);
  return (
    <div className="f-c-row mt-10 w-full">
      {/*QR and code display*/}
      <div className="f-c-col gap-5 p-4">
        <h1 className="text-textTertiary text-lg font-semibold">
          Scan this QR code
        </h1>
        <QRCode
          value={url}
          className="p-4 w-fit bg-white rounded-[20px] max-sm:size-48"
        />

        <div className="text-bgTertiary">or</div>

        <h1 className="text-textTertiary text-[10px] sm:text-[14px] font-semibold">
          Copy and paste this link in other device
        </h1>
        <div className="f-c-row gap-4">
          <div className="text-sm max-sm:hidden font-bold text-textSecondary">
            {url}
          </div>
          <div
            onClick={async () => {
              setCopied(true);
              await navigator.clipboard.writeText(url);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="f-c-row p-1 bg-bgSecondary text-textSecondary sm:text-[12px] font-semibold gap-1 rounded-md cursor-pointer border border-bgTertiary/70"
          >
            {copied ? (
              <MdDone className="text-success" />
            ) : (
              <MdOutlineContentCopy className="text-textTertiary" />
            )}
            {copied ? "Copied" : "Copy Link"}
          </div>
        </div>
      </div>
    </div>
  );
}
