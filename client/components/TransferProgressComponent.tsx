import { TransferInterface } from "@/types/fileTransferInterfaces";
import { motion } from "motion/react";

export default function TransferProgressComponent({
  percentage,
  current,
}: {
  percentage: number;
  current: TransferInterface["current"];
}) {
  if (current === "IN_PROGRESS" || current === "PAUSED") {
    return (
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden min-w-[100px]">
          <motion.div
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`absolute h-full rounded-full ${
              current === "PAUSED"
                ? "bg-textTertiary"
                : "bg-white"
            }`}
          />
          {/* Shimmer effect for active transfers */}
          {current === "IN_PROGRESS" && (
            <motion.div
              className="absolute h-full w-8 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-full"
              animate={{ x: ["-32px", "200px"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>
        <span className="text-xs font-medium text-textSecondary tabular-nums whitespace-nowrap">
          {current === "PAUSED" ? "Paused" : `${percentage}%`}
        </span>
      </div>
    );
  }

  return (
    <span className="text-xs font-medium text-textTertiary">Pending</span>
  );
}
