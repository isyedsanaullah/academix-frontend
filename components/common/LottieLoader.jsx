'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function LottieLoader({
  fullScreen = false,
  size = 140,
  text = '',
  className = '',
}) {
  const [LottieComp, setLottieComp] = useState(null);
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Dynamically import lottie-react only on the client
    import('lottie-react').then((mod) => {
      setLottieComp(() => mod.default);
    });

    // Fetch branded loader animation from public/logo/
    fetch('/logo/reframe-blur-rise.json')
      .then((r) => r.json())
      .then((data) => setAnimationData(data))
      .catch(() =>
        fetch('/logo/reframe-draw-on.json')
          .then((r) => r.json())
          .then((data) => setAnimationData(data))
          .catch(() => setAnimationData(null))
      );
  }, []);

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
        {LottieComp && animationData ? (
          <LottieComp
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          /* Fallback: logo centred inside a spinner ring */
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
