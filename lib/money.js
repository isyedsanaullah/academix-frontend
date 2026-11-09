'use strict';

/**
 * Frontend PKR Money Formatting Helpers
 * Strictly formatted for Pakistani currency display with optional compact rendering.
 */

/**
 * Formats an amount into standard PKR string.
 * e.g. 121458300 -> "PKR 121,458,300"
 * @param {number|string} amount 
 * @returns {string}
 */
export function formatPKR(amount) {
  const num = Math.round(Number(amount) || 0);
  return `PKR ${num.toLocaleString('en-PK')}`;
}

/**
 * Formats an amount into compact representation.
 * e.g. 121458300 -> "PKR 121.5M", 351238 -> "PKR 351.2K"
 * @param {number|string} amount 
 * @param {number} [decimals=1]
 * @returns {string}
 */
export function formatPKRCompact(amount, decimals = 1) {
  const num = Number(amount) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1000000000) {
    return `${sign}PKR ${(abs / 1000000000).toFixed(decimals)}B`;
  }
  if (abs >= 1000000) {
    return `${sign}PKR ${(abs / 1000000).toFixed(decimals)}M`;
  }
  if (abs >= 1000) {
    return `${sign}PKR ${(abs / 1000).toFixed(decimals)}K`;
  }
  return `${sign}PKR ${Math.round(abs)}`;
}

/**
 * Formats a percentage change cleanly.
 * e.g. 24.5 -> "+24.5%", -12.0 -> "-12.0%", null -> "New"
 * @param {number|null} deltaPct 
 * @param {boolean} [isNewBaseline=false]
 * @returns {string}
 */
export function formatMoM(deltaPct, isNewBaseline = false) {
  if (isNewBaseline || deltaPct === null || deltaPct === undefined) {
    return 'New';
  }
  const num = Number(deltaPct);
  if (isNaN(num)) return '—';
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(1)}%`;
}

export default {
  formatPKR,
  formatPKRCompact,
  formatMoM
};

