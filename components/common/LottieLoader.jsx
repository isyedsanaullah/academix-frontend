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

        // Add dynamic CSS shimmer/pulse to the SVG paths inside container
        setTimeout(() => {
          if (!containerRef.current) return;
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.classList.add('animate-logo-pulse');
          }
        }, 100);
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
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Outer Loader Shell with Orbit Rings & Glowing Backdrop */}
      <div className="relative flex items-center justify-center" style={{ width: size + 30, height: size + 30 }}>
        {/* Ambient Radial Backlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/25 via-purple-500/25 to-cyan-500/25 blur-2xl rounded-full scale-90 animate-pulse" />

        {/* Outer Spinning Tech Orbit Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, ease: 'linear', repeat: Infinity }}
          className="absolute inset-0 rounded-full border border-dashed border-indigo-500/40 opacity-70"
        />

        {/* Counter-Spinning Inner Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 7, ease: 'linear', repeat: Infinity }}
          className="absolute inset-2 rounded-full border border-dotted border-purple-400/30 opacity-60"
        />

        {/* Floating Animated Logo Container */}
        <motion.div
          animate={{
            y: [-4, 4, -4],
            scale: [0.97, 1.03, 0.97],
          }}
          transition={{
            duration: 3,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
          className="relative flex items-center justify-center p-2"
        >
          <div
            ref={containerRef}
            style={{ width: size, height: size }}
            className="relative flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          />
        </motion.div>
      </div>

      {/* Loading Text & Bouncing Indicator */}
      {text && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2"
        >
          <span className="text-xs font-bold text-indigo-300 tracking-wider uppercase drop-shadow">
            {text}
          </span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </motion.div>
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#030712]/90 backdrop-blur-lg"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }

  return content;
}

