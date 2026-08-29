'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LottieLoader({
  fullScreen = false,
  size = 140,
  text = '',
  className = '',
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    let anim = null;
    let isMounted = true;

    Promise.all([
      import('lottie-web').then((m) => m.default || m),
      fetch('/loader.json').then((res) => {
        if (!res.ok) throw new Error('Failed to load /loader.json');
        return res.json();
      }),
    ])
      .then(([lottie, animationData]) => {
        if (!isMounted || !containerRef.current) return;
        if (anim) anim.destroy();

        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData,
        });
      })
      .catch((err) => {
        console.error('Failed to load lottie animation:', err);
      });

    return () => {
      isMounted = false;
      if (anim) {
        anim.destroy();
      }
    };
  }, []);

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        ref={containerRef}
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center"
      />
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
