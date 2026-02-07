import { TransferInterface } from "@/types/fileTransferInterfaces";
import { FaFile } from "react-icons/fa";
import TransferProgressComponent from "./TransferProgressComponent";
import { useFileTransferStore } from "@/stores/useFileTransferStore";
import { useEffect, useState } from "react";
import { setFileSize } from "@/lib/fileSize";
import { FaPlay } from "react-icons/fa";
import { FaPause } from "react-icons/fa6";

export default function FileTransferProgressComponent({
  fileInfo,
  onCancel,
  onPause,
  onResume,
}: {
  fileInfo: TransferInterface;
  onCancel: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}) {
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Read progress directly from store for this file
  const fileState = useFileTransferStore((state) => state.files.get(fileInfo.id!));
  const progress = fileState?.progress || 0;

  // Sync local pause state with parent prop (optional but good for consistency)
  useEffect(() => {
    const updateIsPaused = () => {
      setIsPaused(fileInfo.current === "PAUSED");
    }
    updateIsPaused();
  }, [fileInfo]);

  return (
    <div className="flex flex-col items-end">
      {/*Transfer Status*/}
      <div className="bg-bgTertiary/10 rounded-xl w-full p-4 flex items-center justify-between gap-4">
        {/*File Info*/}
        <div className="flex items-center gap-2 min-w-0">
          <FaFile className="text-textSecondary text-3xl shrink-0" />
          <div className="flex flex-col gap-1 min-w-0">
            <div className="text-sm font-semibold text-textSecondary truncate">
              {fileInfo.name}
            </div>
            <div className="text-xs text-textTertiary font-light">
              {setFileSize(fileInfo.size)}
            </div>
          </div>
        </div>

        {/*Progress*/}
        <TransferProgressComponent
          percentage={parseFloat(progress.toFixed(2))}
          current={fileInfo.current}
        />
      </div>

      {/*Transfer Controls*/}
      <div className="rounded-2xl bg-bgTertiary/10 px-3 py-2 flex gap-2">
        {fileInfo.current !== "STOP" && <button
          onClick={() => {
            setIsPaused(!isPaused);
            if (isPaused) {
              onResume(fileInfo.id!);
            } else {
              onPause(fileInfo.id!);
            }
          }}
          className="rounded-lg bg-bgSecondary border-2 cursor-pointer border-bgTertiary text-textTertiary font-semibold px-2 py-1 f-c-row gap-1"
        >
          {isPaused ? <FaPlay /> : <FaPause />}
          {isPaused ? "Resume" : "Pause"}
        </button>}

        <button
          onClick={() => onCancel(fileInfo.id!)}
          className="bg-linear-to-b from-error to-error/50 text-textPrimary rounded-lg text-sm px-3 py-2 font-semibold cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
