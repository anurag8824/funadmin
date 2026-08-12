"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute h-64 w-64 rounded-full bg-brand-purple/30 blur-[100px]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 0.6 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Logo container with story ring */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.8,
          ease: [0.34, 1.56, 0.64, 1],
          delay: 0.2,
        }}
        className="relative"
      >
        <motion.div
          className="story-ring-border"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, ease: "linear", repeat: Infinity }}
        >
          <div className="rounded-full bg-black p-1">
            <div className="relative h-28 w-28 overflow-hidden rounded-full sm:h-32 sm:w-32">
              <Image
                src="/logo.png"
                alt="FuntApp"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* App name */}
      <motion.h1
        className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <span className="text-gradient">Funt</span>
        <span className="text-white">App</span>
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="mt-3 text-center text-sm text-[#B3B3B3] sm:text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        Create, share, and connect
      </motion.p>

      {/* Loading dots — Instagram style */}
      <motion.div
        className="mt-10 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-brand-purple"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
