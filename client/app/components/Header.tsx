"use client";

import Logo from "@/components/Logo";
import { motion } from "motion/react";
import { BsLightningChargeFill } from "react-icons/bs";
import { FiShield, FiZap, FiWifi, FiArrowRight } from "react-icons/fi";

export default function Header({ onTrigger }: { onTrigger: () => void }) {
  return (
    <div className="relative w-full min-h-screen flex flex-col overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/[0.05] rounded-full blur-[80px] pointer-events-none" />

      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-6 py-5 w-full max-w-6xl mx-auto"
      >
        <Logo />
        <button
          onClick={onTrigger}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-bgPrimary bg-white rounded-lg hover:bg-white/90 active:scale-[0.97] transition-all cursor-pointer"
        >
          Get Started
          <FiArrowRight size={14} />
        </button>
      </motion.nav>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] mb-8"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
          </span>
          <span className="text-xs text-textSecondary font-medium">
            Peer-to-peer · No servers involved
          </span>
        </motion.div>

        {/* Title */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-center bg-clip-text bg-gradient-to-b from-white via-white to-white/20 text-transparent leading-tight">
          Send files
          <br />
          <span className="bg-clip-text bg-gradient-to-r from-white/90 to-white/40 text-transparent">
            without limits
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-textSecondary text-base sm:text-lg max-w-xl text-center mt-5 leading-relaxed">
          Transfer files directly between devices using WebRTC.
          <br className="hidden sm:block" />{" "}
          No cloud, no sign-ups, completely encrypted.
        </p>

        {/* CTA */}
        <motion.button
          onClick={onTrigger}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-8 flex items-center gap-2.5 px-7 py-3.5 text-bgPrimary bg-white font-semibold rounded-xl text-base hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-shadow cursor-pointer"
        >
          <BsLightningChargeFill size={16} />
          Start Connection
        </motion.button>

        {/* Trust row */}
        <div className="flex items-center gap-5 mt-8">
          {[
            { icon: FiShield, text: "Encrypted" },
            { icon: FiZap, text: "Instant" },
            { icon: FiWifi, text: "No upload" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-1.5 text-textTertiary"
            >
              <Icon size={13} />
              <span className="text-xs font-medium">{text}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Features section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-20"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              title: "Peer-to-Peer",
              desc: "Files travel directly between devices. Nothing is uploaded to any server.",
              icon: "🔗",
            },
            {
              title: "End-to-End Encrypted",
              desc: "WebRTC encrypts data in transit. Your files remain private and secure.",
              icon: "🔒",
            },
            {
              title: "No Sign-Up Required",
              desc: "Just connect and transfer. No accounts, no installations needed.",
              icon: "⚡",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="glass px-5 py-5 flex flex-col gap-2 hover:bg-white/[0.06] transition-colors"
            >
              <span className="text-xl">{feature.icon}</span>
              <h3 className="text-sm font-semibold text-textPrimary">
                {feature.title}
              </h3>
              <p className="text-xs text-textSecondary leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-24"
      >
        <h2 className="text-xs font-semibold text-textTertiary uppercase tracking-wider text-center mb-8">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              step: "01",
              title: "Enter your name",
              desc: "Give your device a display name so your peer can identify you.",
            },
            {
              step: "02",
              title: "Share the link",
              desc: "Send the pairing link or scan the QR code on the other device.",
            },
            {
              step: "03",
              title: "Transfer files",
              desc: "Drop files and they'll be sent directly. Pause, resume, or cancel anytime.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="glass px-5 py-5 flex flex-col gap-2 hover:bg-white/[0.06] transition-colors"
            >
              <span className="text-xs font-bold text-textTertiary">
                {item.step}
              </span>
              <h3 className="text-sm font-semibold text-textPrimary">
                {item.title}
              </h3>
              <p className="text-xs text-textSecondary leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/[0.06] px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <p className="text-xs text-textTertiary">
            Built with WebRTC
          </p>
        </div>
      </div>
    </div>
  );
}
