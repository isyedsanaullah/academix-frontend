'use client';

import { useMemo } from 'react';
import { useTheme } from '../providers/ThemeProvider';

/**
 * Colour-Blind-Safe Recharts Palette (Brand Blue + Brand Green + Okabe-Ito & Neutrals)
 * - Default charts use at most 4 series (Blue, Green, Vermilion, Slate).
 * - For 5+ series, pair with CHART_DASH_PATTERNS or direct data labels so colour is never sole indicator.
 * - Zero overlap with Plan Accents (--chart-3 and --chart-5 are distinct from Premium/Starter).
 */
export const CHART_SERIES_VARS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
];

export const CHART_DEFAULT_4_VARS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
];

export const CHART_DASH_PATTERNS = [
  undefined,
  '6 3',
  '2 2',
  '8 4 2 4',
  '4 4',
  '10 3',
  '3 3',
  '12 4',
];

const LIGHT_HEX = {
  series: ['#0B4D94', '#289A48', '#D55E00', '#64748B', '#0072B2', '#882255', '#1E3A8A', '#DC2626'],
  default4: ['#0B4D94', '#289A48', '#D55E00', '#64748B'],
  primary: '#0B4D94',
  secondary: '#289A48',
  warning: '#D55E00',
  danger: '#DC2626',
  neutral: '#64748B',
  grid: '#E2E8F0',
  axis: '#5B6B82',
  tooltipBg: '#FFFFFF',
  tooltipBorder: '#E2E8F0',
  tooltipText: '#0F1B2D',
};

const DARK_HEX = {
  series: ['#4C94E8', '#3DBE63', '#FF8A4C', '#93A4BF', '#56B4E9', '#CC79A7', '#93C5FD', '#F87171'],
  default4: ['#4C94E8', '#3DBE63', '#FF8A4C', '#93A4BF'],
  primary: '#4C94E8',
  secondary: '#3DBE63',
  warning: '#FF8A4C',
  danger: '#F87171',
  neutral: '#93A4BF',
  grid: '#24324D',
  axis: '#93A4BF',
  tooltipBg: '#16213A',
  tooltipBorder: '#24324D',
  tooltipText: '#E6EDF7',
};

export function useChartTheme() {
  const { theme } = useTheme();
  return useMemo(() => {
    const palette = theme === 'dark' ? DARK_HEX : LIGHT_HEX;
    return {
      ...palette,
      dashPatterns: CHART_DASH_PATTERNS,
      tooltipStyle: {
        backgroundColor: palette.tooltipBg,
        borderColor: palette.tooltipBorder,
        borderRadius: '16px',
        color: palette.tooltipText,
        fontSize: '12px',
        fontWeight: 500,
        boxShadow: 'var(--box-shadow-dropdown)',
        padding: '10px 14px',
      },
      axisTickStyle: {
        fill: palette.axis,
        fontSize: 12,
        fontFamily: 'InterDisplay, Inter, sans-serif',
      },
    };
  }, [theme]);
}

