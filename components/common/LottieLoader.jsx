'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LottieLoader({
  fullScreen = false,
  size = 140,
  text = '',
  className = '',
}) {
  const [LottieComp, setLottieComp] = useState(null);
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Dynamically load lottie-react component on client
    import('lottie-react')
      .then((mod) => {
        const Comp = mod.Lottie || mod.default || mod;
        setLottieComp(() => Comp);
      })
      .catch((err) => {
        console.error('Failed to import lottie-react:', err);
      });

    // Fetch the original loader.json from public directory
    fetch('/loader.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((json) => setAnimationData(json))
      .catch((err) => {
        console.error('Failed to load /loader.json, trying fallback:', err);
        fetch('/logo/loader.json')
          .then((res) => res.json())
          .then((json) => setAnimationData(json))
          .catch(() => setAnimationData(null));
      });
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
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
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
