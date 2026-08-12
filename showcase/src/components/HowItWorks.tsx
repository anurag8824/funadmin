"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    step: "01",
    title: "Download",
    description: "Get FuntApp free from Google Play. Sign up with Google or email in seconds.",
    icon: "📲",
  },
  {
    step: "02",
    title: "Create",
    description: "Record reels, post stories, or go live. Add music, filters, and stickers.",
    icon: "✨",
  },
  {
    step: "03",
    title: "Connect",
    description: "Follow creators, chat with friends, send gifts, and build your community.",
    icon: "🤝",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative overflow-hidden px-6 py-24 sm:px-10 lg:px-20">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-purple/5 blur-[100px]" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-5xl">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-brand-purple">
            How it works
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Start in <span className="text-gradient">3 simple steps</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-0 hidden h-0.5 w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-brand-purple/30 to-transparent lg:block" />

          <div className="grid gap-8 lg:grid-cols-3">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                className="relative text-center"
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <motion.div
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand-purple/30 bg-surface text-3xl"
                  whileHover={{ scale: 1.1, borderColor: "#8E008E" }}
                >
                  {item.icon}
                </motion.div>
                <span className="mb-2 block text-xs font-bold tracking-widest text-brand-purple">
                  STEP {item.step}
                </span>
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-sm text-[#B3B3B3]">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
