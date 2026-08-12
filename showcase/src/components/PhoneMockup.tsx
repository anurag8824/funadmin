"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const screens = [
  {
    id: "feed",
    label: "Feed",
    gradient: "from-[#1a1a2e] to-[#16213e]",
    content: (
      <div className="flex h-full flex-col p-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-gradient">FuntApp</span>
          <div className="flex gap-2">
            <div className="h-5 w-5 rounded bg-white/10" />
            <div className="h-5 w-5 rounded bg-white/10" />
          </div>
        </div>
        {/* Stories row */}
        <div className="mb-3 flex gap-2 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-1">
              <div className="story-ring-border">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-orange to-brand-purple" />
              </div>
              <span className="text-[8px] text-[#B3B3B3]">user{i + 1}</span>
            </div>
          ))}
        </div>
        {/* Post cards */}
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="mb-2 overflow-hidden rounded-xl bg-[#0D0D0D] border border-white/5"
          >
            <div className="flex items-center gap-2 p-2">
              <div className="h-6 w-6 rounded-full bg-brand-purple/50" />
              <span className="text-[10px] font-medium">creator_{i + 1}</span>
            </div>
            <div className="aspect-square bg-gradient-to-br from-brand-pink/30 to-brand-purple/30" />
            <div className="flex gap-3 p-2">
              <span className="text-xs">❤️</span>
              <span className="text-xs">💬</span>
              <span className="text-xs">↗️</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "reels",
    label: "Reels",
    gradient: "from-black to-[#1a0a2e]",
    content: (
      <div className="relative flex h-full flex-col">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-purple/40 via-brand-pink/20 to-black" />
        <div className="relative flex flex-1 flex-col justify-end p-4">
          <div className="absolute right-3 bottom-24 flex flex-col gap-4">
            {["❤️", "💬", "↗️", "🔖"].map((icon, i) => (
              <motion.div
                key={icon}
                className="flex flex-col items-center"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-lg">{icon}</span>
                <span className="text-[8px] text-white/70">
                  {[892, 42, "", ""][i]}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="mb-2">
            <p className="text-xs font-bold">@fun_creator</p>
            <p className="text-[10px] text-white/70">
              Living my best life ✨ #funtapp #reels
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
            <span className="text-sm">🎵</span>
            <p className="text-[9px] truncate">Trending Sound · Original</p>
          </div>
        </div>
        {/* Bottom nav */}
        <div className="relative flex justify-around border-t border-white/10 py-2">
          {["🏠", "🔍", "➕", "🎬", "👤"].map((icon, i) => (
            <span
              key={i}
              className={`text-sm ${i === 3 ? "text-brand-purple" : "opacity-60"}`}
            >
              {icon}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "live",
    label: "Live",
    gradient: "from-[#0a0015] to-[#1a0030]",
    content: (
      <div className="relative flex h-full flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-coral/30 to-brand-purple/40" />
        <div className="relative p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-brand-purple/60" />
              <div>
                <p className="text-[10px] font-bold">live_host</p>
                <p className="text-[8px] text-[#B3B3B3]">12.4K watching</p>
              </div>
            </div>
            <span className="rounded bg-red-500 px-2 py-0.5 text-[8px] font-bold animate-pulse">
              LIVE
            </span>
          </div>
        </div>
        <div className="relative flex-1" />
        {/* Floating comments */}
        <div className="relative space-y-1 p-3">
          {["🔥 Amazing!", "Love this!", "Sent gift 🎁"].map((msg, i) => (
            <motion.div
              key={i}
              className="inline-block rounded-full bg-black/40 px-2 py-1 text-[9px]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.3 }}
            >
              {msg}
            </motion.div>
          ))}
        </div>
        {/* Gift animation */}
        <motion.div
          className="absolute bottom-20 right-4 text-2xl"
          animate={{ y: [-20, -60], opacity: [1, 0], scale: [1, 1.5] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        >
          🎁
        </motion.div>
      </div>
    ),
  },
  {
    id: "chat",
    label: "Chat",
    gradient: "from-[#0D0D0D] to-[#1a1a1a]",
    content: (
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 p-3">
          <p className="text-sm font-bold">Messages</p>
        </div>
        <div className="flex-1 space-y-3 p-3">
          {[
            { name: "Alex", msg: "Did you see that reel? 🔥", time: "2m", unread: true },
            { name: "Sam", msg: "Going live tonight!", time: "15m", unread: false },
            { name: "Jordan", msg: "Sent you a voice note 🎤", time: "1h", unread: false },
          ].map((chat, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-pink to-brand-purple" />
                {chat.unread && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brand-purple" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <p className="text-[11px] font-semibold">{chat.name}</p>
                  <p className="text-[9px] text-[#B3B3B3]">{chat.time}</p>
                </div>
                <p className="truncate text-[10px] text-[#B3B3B3]">{chat.msg}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function PhoneMockup() {
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % screens.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const screen = screens[activeScreen];

  return (
    <div className="relative animate-float">
      {/* Glow behind phone */}
      <div className="absolute inset-0 scale-110 rounded-[3rem] bg-brand-purple/20 blur-[60px]" />

      {/* Phone frame */}
      <div className="relative w-[260px] sm:w-[280px]">
        {/* Outer frame */}
        <div className="rounded-[2.5rem] border-[3px] border-[#2a2a2a] bg-[#1a1a1a] p-2 shadow-2xl shadow-brand-purple/20">
          {/* Notch */}
          <div className="mx-auto mb-1 h-5 w-24 rounded-full bg-black" />

          {/* Screen */}
          <div className="relative h-[480px] overflow-hidden rounded-[2rem] bg-black">
            <AnimatePresence mode="wait">
              <motion.div
                key={screen.id}
                className={`absolute inset-0 bg-gradient-to-b ${screen.gradient}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
              >
                {screen.content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Home indicator */}
          <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-white/30" />
        </div>

        {/* Screen tabs */}
        <div className="mt-4 flex justify-center gap-2">
          {screens.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveScreen(i)}
              className={`rounded-full px-3 py-1 text-xs transition-all ${
                i === activeScreen
                  ? "bg-brand-purple text-white"
                  : "bg-white/10 text-[#B3B3B3] hover:bg-white/20"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
