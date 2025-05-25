'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function HeroSection() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate progress based on first viewport height
      const viewportHeight = window.innerHeight;
      const scrolled = window.scrollY;
      const progress = Math.min(scrolled / viewportHeight, 1);
      setProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Transform values based on scroll progress
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const circleScale = 1 + progress * (isMobile ? 15 : 8); // Scale from 1 to 15 on mobile, 1 to 5 otherwise
  const textScale = 1 + progress * 0.5; // Scale from 1 to 1.5
  const borderRadius = 50 - (progress > 0.8 ? progress * 50 : 0); // Border radius from 50% to 0%

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen overflow-x-clip bg-[#F0F8FF]">
      <motion.div
        className="relative flex h-48 w-48 md:h-64 md:w-64 lg:h-96 lg:w-96"
        animate={{ scale: circleScale }}
        transition={{ duration: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-zinc-950 rounded-full"
          animate={{ borderRadius: `${borderRadius}%` }}
          transition={{ duration: 0 }}
        />
      </motion.div>

      <motion.h1
        className="absolute text-6xl font-bold md:text-8xl lg:text-9xl text-white drop-shadow-[0_0_32px_rgba(168,85,247,0.4)] mix-blend-difference"
        animate={{ scale: textScale }}
        transition={{ duration: 0 }}
      >
        SUBASH S
      </motion.h1>
    </div>
  );
}
