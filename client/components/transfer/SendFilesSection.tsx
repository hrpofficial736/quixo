import FileTransferProgressComponent from "@/components/FileTransferProgressComponent";
import { TransferInterface } from "@/types/fileTransferInterfaces";
import React, { useRef } from "react";
import { IoIosSend } from "react-icons/io";

interface SendFilesSectionProps {
  transfers: TransferInterface[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

export default function SendFilesSection({
  transfers,
  onFileChange,
  onCancel,
  onPause,
  onResume,
}: SendFilesSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col gap-2 mt-10">
      <div className="flex justify-between items-center">
        <h1 className="font-semibold text-sm text-textTertiary">Send Files</h1>
        <button
          onClick={() => {
            fileInputRef.current?.click();
          }}
          className="rounded-md px-2 py-1 text-sm f-c-row gap-2 max-w-60 bg-linear-to-b from-textSecondary to-textSecondary/80 text-bgSecondary font-semibold cursor-pointer"
        >
          <IoIosSend />
          Send Files
        </button>
      </div>
      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        multiple
        onChange={onFileChange}
      />
      {transfers.map((transfer) => {
        return (
          <FileTransferProgressComponent
            key={transfer.id}
            fileInfo={transfer}
            onCancel={onCancel}
            onPause={onPause}
            onResume={onResume}
          />
        );
      })}
      {transfers.length === 0 && (
        <h1 className="text-xs w-full f-c-row mt-10 font-semibold text-textTertiary">
          No ongoing transfers
        </h1>
      )}
    </div>
  );
}
