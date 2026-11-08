'use client';

/**
 * Returns the DOM portal root that lives INSIDE the [data-app] wrapper
 * so that all Modal, Slide-over, Dropdown, Select popover, Tooltip, and Toaster
 * overlays inherit [data-app], [data-theme], [data-plan], [data-sub-status],
 * InterDisplay typography, and all scoped design tokens.
 */
export function getAppPortalRoot() {
  if (typeof document === 'undefined') return null;
  const appPortal = document.getElementById('app-portal-root');
  if (appPortal) return appPortal;
  const fallbackApp = document.querySelector('[data-app]');
  if (fallbackApp) return fallbackApp;
  return document.body;
}
