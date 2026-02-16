import { inter } from "@/app/fonts";
import Logo from "@/components/Logo";
import { motion } from "motion/react";

export default function LoadingPage() {
  return (
    <div
      className={`w-screen h-screen bg-bgPrimary flex flex-col items-center justify-center ${inter.className} relative overflow-hidden`}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Logo />
      </motion.div>

      {/* Animated ring */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-10 relative"
      >
        <svg width="48" height="48" viewBox="0 0 48 48" className="animate-spin [animation-duration:1.5s]">
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="3"
          />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="80 126"
          />
        </svg>
      </motion.div>

      {/* Status text */}
      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-5 text-sm text-textTertiary font-medium"
      >
        Establishing connection...
      </motion.p>

      {/* Subtle tip that cycles */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ delay: 2, duration: 4, repeat: Infinity, repeatDelay: 1 }}
        className="mt-3 text-xs text-textTertiary/60 max-w-xs text-center"
      >
        Files are sent directly between devices — nothing passes through a server
      </motion.p>
    </div>
  );
}
