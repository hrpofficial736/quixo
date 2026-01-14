import { motion } from "motion/react";
import { useEffect, useState } from "react";

export default function TransferProgressComponent({
  percentage,
  current,
}: {
  percentage: number;
  current: "START" | "WAIT" | "STOP";
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
      {current === "START" ? (
        <div className="flex flex-col gap-0.5">
          <div className="text-xs font-medium self-end">{progress} %</div>
          <div className="relative w-30 h-2.5 bg-bgTertiary/40 rounded-full">
            <motion.div
              animate={{
                width: `${progress}%`,
              }}
              transition={{
                duration: 0.3,
              }}
              className="absolute h-full z-40 bg-textSecondary rounded-full"
            />
          </div>
        </div>
      ) : (
        <h1 className="text-sm font-medium text-textTertiary">Pending</h1>
      )}
    </>
  );
}
