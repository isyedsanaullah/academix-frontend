'use client';

import { useState, useEffect } from 'react';

/**
 * Debounce a reactive state value by specified delay (default 300ms).
 * Prevents heavy re-renders and re-filtering on every keystroke.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;

