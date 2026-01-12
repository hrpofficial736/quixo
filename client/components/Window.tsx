import { IoClose } from "react-icons/io5";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
export default function Window({
  children,
  extraClass,
  header,
  onClose,
}: {
  children: React.ReactNode;
  extraClass: string;
  header: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{
        scale: 0.7,
        opacity: 0,
      }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      exit={{
        scale: 0.7,
        opacity: 0,
      }}
      transition={{
        duration: 0.3,
      }}
      className={`bg-bgSecondary rounded-2xl px-5 py-3 ${extraClass} z-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="text-2xl text-textTertiary font-semibold">{header}</div>

        <div
          onClick={onClose}
          className="p-1 cursor-pointer rounded-full text-textPrimary bg-error"
        >
          <IoClose />
        </div>
      </div>
      {children}
    </motion.div>
  );
}
