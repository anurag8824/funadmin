"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    icon: "🎬",
    title: "Reels & Short Videos",
    description:
      "Scroll through endless vertical videos. Create with music, stickers, filters, and share your moments with the world.",
    gradient: "from-brand-pink/20 to-brand-purple/20",
    accent: "#B429F9",
  },
  {
    icon: "⭕",
    title: "Stories",
    description:
      "Share 24-hour stories with your followers. Add photos, videos, and stickers that disappear — just like the classics.",
    gradient: "from-brand-orange/20 to-brand-coral/20",
    accent: "#F77737",
  },
  {
    icon: "📡",
    title: "Go Live",
    description:
      "Broadcast live to your audience. Receive virtual gifts, interact in real-time, and build your community.",
    gradient: "from-brand-coral/20 to-brand-purple/20",
    accent: "#FF4D67",
  },
  {
    icon: "💬",
    title: "Real-time Chat",
    description:
      "Message friends with text, photos, and voice notes. Forward reels and posts directly in your conversations.",
    gradient: "from-brand-purple/20 to-brand-pink/20",
    accent: "#8E008E",
  },
  {
    icon: "🔍",
    title: "Explore & Discover",
    description:
      "Find trending creators, explore hashtags, and discover content tailored to your interests.",
    gradient: "from-brand-pink/20 to-brand-orange/20",
    accent: "#E1306C",
  },
  {
    icon: "🎁",
    title: "Gifts & Coins",
    description:
      "Support your favorite creators with virtual gifts. Earn coins, send love, and be part of the creator economy.",
    gradient: "from-brand-orange/20 to-brand-purple/20",
    accent: "#FD1D1D",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-surface p-6 transition-colors hover:border-white/10"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
      />
      <div className="relative">
        <motion.div
          className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {feature.icon}
        </motion.div>
        <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
        <p className="text-sm leading-relaxed text-[#B3B3B3]">
          {feature.description}
        </p>
        <div
          className="mt-4 h-0.5 w-0 rounded-full transition-all duration-500 group-hover:w-full"
          style={{ backgroundColor: feature.accent }}
        />
      </div>
    </motion.div>
  );
}

export default function FeatureShowcase() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true });

  return (
    <section className="relative px-6 py-24 sm:px-10 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <motion.div
          ref={headerRef}
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-brand-purple">
            Features
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            Everything you need to{" "}
            <span className="text-gradient">create & connect</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[#B3B3B3]">
            From short-form video to live streaming — FuntApp brings the full
            social experience to your pocket.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
