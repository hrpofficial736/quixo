"use client";

import { motion } from "motion/react";

export default function Header({ onTrigger }: { onTrigger: () => void }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 0.7,
      }}
      className={`p-5 w-full h-full f-c-col`}
    >
      <h1 className="text-6xl sm:text-8xl lg:text-9xl font-bold bg-clip-text bg-linear-to-b from-textPrimary to-textPrimary/20 text-transparent">
        Quixo
      </h1>
      <p className="text-textTertiary sm:text-xl max-w-2xl text-center mt-2">
        Quixo is a secure, peer-to-peer file sharing platform that lets you
        transfer files instantly between devices using WebRTC — with no uploads,
        no sign-ups, and complete privacy.
      </p>
      <input className="hidden" type="file" />
      <button
        onClick={onTrigger}
        className="py-3 px-7 active:scale-[0.98] transition-all bg-linear-to-b from-textPrimary to-textPrimary/60 cursor-pointer rounded-full text-lg sm:text-xl font-semibold mt-7"
      >
        Start Connection
      </button>
    </motion.div>
  );
}
