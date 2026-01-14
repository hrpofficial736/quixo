import { TransferInterface } from "@/types/fileTransferInterfaces";
import { FaFile } from "react-icons/fa";
import TransferProgressComponent from "./TransferProgressComponent";
import { useFileTransferStore } from "@/stores/useFileTransferStore";
import { useEffect, useState } from "react";
import { setFileSize } from "@/lib/fileSize";

export default function FileTransferProgressComponent({
  fileInfo,
}: {
  fileInfo: TransferInterface;
}) {
  const { progress } = useFileTransferStore();
  const [fileProgress, setFileProgress] = useState<number>(0);

  useEffect(() => {
    if (fileInfo.current !== "START") return;
    const updateProgress = () => setFileProgress(progress);
    updateProgress();
  }, [progress, fileInfo.current]);

  return (
    <div className="bg-bgTertiary/10 rounded-xl w-full p-4 flex items-center justify-between">
      <div className="f-c-row gap-2">
        <FaFile className="text-textSecondary text-3xl" />
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold text-textSecondary">
            {fileInfo.name}
          </div>
          <div className="text-xs text-textTertiary font-light">
            {setFileSize(fileInfo.size)}
          </div>
        </div>
      </div>

      {/*Progress and Cancel*/}
      <div className="flex items-center gap-4">
        <TransferProgressComponent
          percentage={parseFloat(fileProgress.toFixed(2))}
          current={fileInfo.current}
        />
        <button className="bg-linear-to-b from-error to-error/50 text-textPrimary rounded-lg text-sm px-3 py-2 font-semibold cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  );
}
