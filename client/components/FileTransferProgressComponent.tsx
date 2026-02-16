import { TransferInterface } from "@/types/fileTransferInterfaces";
import TransferProgressComponent from "./TransferProgressComponent";
import { useFileTransferStore } from "@/stores/useFileTransferStore";
import { setFileSize } from "@/lib/fileSize";
import { getFileTypeInfo } from "@/lib/fileIcon";
import { FiPause, FiPlay, FiX } from "react-icons/fi";
import { motion } from "motion/react";

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
  const progress = useFileTransferStore(
    (state) => state.files.get(fileInfo.id!)?.progress ?? 0,
  );
  const percentage = Math.round(progress);
  const { label: typeLabel, color: typeColor } = getFileTypeInfo(fileInfo.mime || "");

  // Get file extension
  const ext = fileInfo.name.split(".").pop()?.toUpperCase() || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="glass px-4 py-3 flex flex-col gap-2.5"
    >
      {/* Top row: file info + actions */}
      <div className="flex items-center justify-between gap-3 min-w-0">
        {/* File info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Extension badge */}
          <div className="h-9 w-9 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
            <span className={`text-[10px] font-bold ${typeColor}`}>{ext}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-textPrimary font-medium truncate">
              {fileInfo.name}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-textTertiary">
                {setFileSize(fileInfo.size)}
              </span>
              <span className="text-[11px] text-textTertiary">•</span>
              <span className={`text-[11px] font-medium ${typeColor}`}>
                {typeLabel}
              </span>
              {fileInfo.current === "PAUSED" && fileInfo.pausedBy === "peer" && (
                <>
                  <span className="text-[11px] text-textTertiary">•</span>
                  <span className="text-[11px] text-textTertiary italic">
                    Paused by peer
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {fileInfo.current === "IN_PROGRESS" && (
            <button
              onClick={() => onPause(fileInfo.id!)}
              className="p-1.5 rounded-md hover:bg-white/[0.06] text-textSecondary hover:text-white transition-all cursor-pointer"
              title="Pause"
            >
              <FiPause size={14} />
            </button>
          )}
          {fileInfo.current === "PAUSED" && fileInfo.pausedBy !== "peer" && (
            <button
              onClick={() => onResume(fileInfo.id!)}
              className="p-1.5 rounded-md hover:bg-white/[0.06] text-textSecondary hover:text-white transition-all cursor-pointer"
              title="Resume"
            >
              <FiPlay size={14} />
            </button>
          )}
          <button
            onClick={() => onCancel(fileInfo.id!)}
            className="p-1.5 rounded-md hover:bg-error/10 text-textTertiary hover:text-error transition-all cursor-pointer"
            title="Cancel"
          >
            <FiX size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <TransferProgressComponent percentage={percentage} current={fileInfo.current} />
    </motion.div>
  );
}
