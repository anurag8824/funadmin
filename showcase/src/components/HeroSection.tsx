"use client";

import { motion } from "framer-motion";
import PhoneMockup from "./PhoneMockup";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.infayou.funtapp";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-16 pb-12 sm:px-10 lg:px-20">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-pink/20 blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand-purple/20 blur-[120px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        {/* Left content */}
        <motion.div
          className="flex-1 text-center lg:text-left"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#B3B3B3]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Available on Android
          </motion.div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Your fun
            <br />
            <span className="text-gradient">social world</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg text-[#B3B3B3] lg:mx-0 mx-auto">
            Watch reels, share stories, go live, and connect with creators.
            Everything you love about social video — in one app.
          </p>

          <motion.div
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl bg-white px-6 py-3.5 text-black transition-transform hover:scale-105 active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a1.003 1.003 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z" />
              </svg>
              <div className="text-left">
                <p className="text-xs leading-none opacity-70">GET IT ON</p>
                <p className="text-lg font-semibold leading-tight">
                  Google Play
                </p>
              </div>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="mt-12 flex justify-center gap-8 lg:justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {[
              { value: "Reels", label: "Short videos" },
              { value: "Live", label: "Go live" },
              { value: "Chat", label: "Real-time" },
            ].map((stat) => (
              <div key={stat.label} className="text-center lg:text-left">
                <p className="text-lg font-bold text-gradient">{stat.value}</p>
                <p className="text-xs text-[#B3B3B3]">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Phone mockup */}
        <motion.div
          className="flex-1 flex justify-center"
          initial={{ opacity: 0, x: 40, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <PhoneMockup />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex flex-col items-center gap-2 text-[#B3B3B3]">
          <span className="text-xs">Scroll to explore</span>
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </motion.div>
    </section>
  );
}
