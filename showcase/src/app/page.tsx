"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import HeroSection from "@/components/HeroSection";
import FeatureShowcase from "@/components/FeatureShowcase";
import HowItWorks from "@/components/HowItWorks";
import PlayStoreCTA from "@/components/PlayStoreCTA";
import Footer from "@/components/Footer";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <main className="relative min-h-screen bg-black">
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {!showSplash && (
        <>
          <HeroSection />
          <FeatureShowcase />
          <HowItWorks />
          <PlayStoreCTA />
          <Footer />
        </>
      )}
    </main>
  );
}
