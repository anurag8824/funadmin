"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.infayou.funtapp";

export default function PlayStoreCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative px-6 py-24 sm:px-10 lg:px-20">
      <motion.div
        ref={ref}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-brand-gradient opacity-90" />
        <motion.div
          className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-[80px]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-black/20 blur-[80px]"
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <div className="relative flex flex-col items-center px-8 py-16 text-center sm:px-16">
          <motion.div
            className="story-ring-border mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, ease: "linear", repeat: Infinity }}
          >
            <div className="rounded-full bg-black/20 p-1 backdrop-blur-sm">
              <div className="relative h-16 w-16 overflow-hidden rounded-full">
                <Image
                  src="/logo.png"
                  alt="FuntApp"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </motion.div>

          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to join the fun?
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Download FuntApp today and start creating, sharing, and connecting
            with millions of creators.
          </p>

          <motion.a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-black shadow-xl shadow-black/20 transition-transform hover:scale-105 active:scale-95"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="currentColor">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a1.003 1.003 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z" />
            </svg>
            <div className="text-left">
              <p className="text-xs leading-none opacity-70">GET IT ON</p>
              <p className="text-xl font-semibold leading-tight">Google Play</p>
            </div>
          </motion.a>

          <p className="mt-6 text-xs text-white/50">
            Free to download · Android 8.0+
          </p>
        </div>
      </motion.div>
    </section>
  );
}
