import { TransferInterface } from "@/types/fileTransferInterfaces";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export default function TransferProgressComponent({
  percentage,
  current,
}: {
  percentage: number;
  current: TransferInterface["current"];
}) {
  const [progress, setProgress] = useState<number>(percentage);

  useEffect(() => {
    const updatePercentage = () => {
      setProgress(percentage);
    };
    updatePercentage();
  }, [percentage]);
  return (
    <>
      {current === "IN_PROGRESS" || current === "PAUSED" ? (
        <div className="flex flex-col gap-0.5">
          <div className="text-xs font-medium self-end">
            {current === "PAUSED" ? "Paused" : `${progress} %`}
          </div>
          <div className="relative w-30 h-2.5 bg-bgTertiary/40 rounded-full">
            <motion.div
              animate={{
                width: `${progress}%`,
              }}
              transition={{
                duration: 0.3,
              }}
              className={`absolute h-full z-40 rounded-full ${current === "PAUSED" ? "bg-textTertiary" : "bg-textSecondary"}`}
            />
          </div>
        </div>
      ) : (
        <h1 className="text-sm font-medium text-textTertiary">Pending</h1>
      )}
    </>
  );
}
