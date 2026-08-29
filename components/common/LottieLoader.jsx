'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// Dynamically import Lottie to prevent SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export default function LottieLoader({
  fullScreen = false,
  size = 140,
  text = '',
  className = '',
}) {
  const [mounted, setMounted] = useState(false);
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    setMounted(true);
    // Fetch the branded logo blur-rise animation from public/logo/
    fetch('/logo/reframe-blur-rise.json')
      .then((r) => r.json())
      .then((data) => setAnimationData(data))
      .catch(() => {
        // Fallback to draw-on animation
        fetch('/logo/reframe-draw-on.json')
          .then((r) => r.json())
          .then((data) => setAnimationData(data))
          .catch(() => setAnimationData(null));
      });
  }, []);

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
        {mounted && animationData ? (
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          /* Fallback: static logo + spinner ring */
          <div className="relative flex items-center justify-center w-full h-full">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <div className="w-1/2 h-1/2 relative">
              <Image src="/logo.svg" alt="Academix" fill className="object-contain" priority />
            </div>
          </div>
        )}
      </div>
      {text && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xs font-semibold text-white/60 tracking-wide text-center"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#04070d]/90 backdrop-blur-md"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }

  return content;
}
