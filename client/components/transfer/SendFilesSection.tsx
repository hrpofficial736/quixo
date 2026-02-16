import FileTransferProgressComponent from "@/components/FileTransferProgressComponent";
import { TransferInterface } from "@/types/fileTransferInterfaces";
import React, { useRef, useState } from "react";
import { LuCloudUpload } from "react-icons/lu";

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
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Simulate an input change event
      const fakeEvent = {
        target: { files: e.dataTransfer.files },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onFileChange(fakeEvent);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          group relative cursor-pointer rounded-xl border-2 border-dashed
          transition-all duration-300 py-10
          flex flex-col items-center justify-center gap-3
          ${
            isDragging
              ? "border-white/40 bg-white/[0.06]"
              : "border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]"
          }
        `}
      >
        <div
          className={`
            p-3 rounded-full bg-white/[0.06] transition-all duration-300
            ${isDragging ? "scale-110 bg-white/10" : "group-hover:scale-105"}
          `}
        >
          <LuCloudUpload
            className={`text-2xl transition-colors duration-300 ${isDragging ? "text-white" : "text-textSecondary"}`}
          />
        </div>
        <div className="text-center">
          <p className={`text-sm font-medium transition-colors ${isDragging ? "text-white" : "text-textSecondary"}`}>
            Drop files here or <span className="text-white underline underline-offset-2">browse</span>
          </p>
          <p className="text-xs text-textTertiary mt-1">
            Files are sent directly peer-to-peer
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        multiple
        onChange={onFileChange}
      />

      {/* Active Transfers */}
      {transfers.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-textTertiary uppercase tracking-wider">
            Transfers
          </h2>
          <div className="flex flex-col gap-2">
            {transfers.map((transfer) => (
              <FileTransferProgressComponent
                key={transfer.id}
                fileInfo={transfer}
                onCancel={onCancel}
                onPause={onPause}
                onResume={onResume}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
