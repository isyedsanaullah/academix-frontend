'use client';

import React from 'react';
import CollegesHubLoader from './CollegesHubLoader';

/**
 * LottieLoader (Proxy to CollegesHub Official Animated Wordmark Loader)
 * Maintained for backward compatibility across all legacy and current pages.
 */
export default function LottieLoader({
  fullScreen = false,
  size = 140,
  text = 'Preparing your campus…',
  className = '',
}) {
  const mappedSize = size <= 160 ? 'sm' : size <= 260 ? 'md' : 'lg';

  // Even if legacy callers pass fullScreen={true}, honor user directive to confine loaders to content area
  return (
    <CollegesHubLoader
      fullScreen={false}
      size={mappedSize}
      text={text}
      className={className}
    />
  );
}
