import { FileTransferMetaDataRequestInterface } from "@/types/fileTransferInterfaces";
import { setFileSize } from "@/lib/fileSize";
import { getFileTypeInfo } from "@/lib/fileIcon";
import { FiCheck, FiX } from "react-icons/fi";
import { motion } from "motion/react";

export default function FileTransferRequestComponent({
  fileInfo,
  onResponse,
}: {
  fileInfo: FileTransferMetaDataRequestInterface;
  onResponse: (res: boolean, id: string) => void;
}) {
  const { label: typeLabel, color: typeColor } = getFileTypeInfo(fileInfo.mime || "");
  const ext = fileInfo.name.split(".").pop()?.toUpperCase() || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="glass px-4 py-3 flex items-center justify-between gap-3"
    >
      {/* File info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-9 w-9 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
          <span className={`text-[10px] font-bold ${typeColor}`}>{ext}</span>
        </div>
        <div className="min-w-0">
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
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onResponse(true, fileInfo.id!)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 active:scale-[0.97] transition-all cursor-pointer"
        >
          <FiCheck size={13} />
          Accept
        </button>
        <button
          onClick={() => onResponse(false, fileInfo.id!)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-textSecondary text-xs font-medium hover:bg-white/[0.04] active:scale-[0.97] transition-all cursor-pointer"
        >
          <FiX size={13} />
          Reject
        </button>
      </div>
    </motion.div>
  );
}
