'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon';
import { getAppPortalRoot } from '../../lib/portal';

/**
 * SlideOverDrawer — Universal full-height slide-over panel that slides in from the right.
 * Features:
 * - Slides in smoothly from the right side (`animate-slide-left`)
 * - Takes full viewport height (`h-full` / `inset-y-0 right-0`)
 * - Refined circular close button
 * - Custom vertical scroller (`custom-drawer-scrollbar`)
 * - Portaled inside `#app-portal-root` so it inherits theme, plan accents, and CSS variables
 */
const SlideOverDrawer = ({
  open = false,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  width = 'w-full sm:max-w-lg',
  className = '',
  ariaLabel,
}) => {
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const portalRoot = getAppPortalRoot();

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title || 'Drawer panel'}
      className="fixed inset-0 z-[120] flex justify-end"
    >
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-b-surface1/70 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over surface (Full height, right-aligned) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 flex flex-col h-full ${width} bg-b-surface2 border-l border-s-subtle shadow-dropdown animate-slide-left overflow-hidden ${className}`}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between gap-4 px-7 py-6 border-b border-s-subtle bg-b-surface2 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            {icon && (
              <div className="flex items-center justify-center size-11 rounded-2xl bg-primary-01/10 text-primary-01 border border-primary-01/20 shrink-0">
                <Icon name={icon} className="!size-5 fill-current" />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-h6 text-t-primary font-bold truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-0.5 text-caption text-t-secondary truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="flex items-center justify-center size-11 rounded-full bg-b-surface1 border border-s-subtle text-t-secondary hover:text-t-primary hover:border-s-highlight transition-all cursor-pointer shrink-0 shadow-widget"
            >
              <Icon name="close" className="!size-4 fill-current" />
            </button>
          )}
        </div>

        {/* Scrollable Body with Custom Vertical Scroller */}
        <div className="flex-1 overflow-y-auto px-7 py-6 custom-drawer-scrollbar">
          {children}
        </div>

        {/* Optional Sticky Footer */}
        {footer && (
          <div className="px-7 py-4 border-t border-s-subtle bg-b-surface2/90 backdrop-blur-xs shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return portalRoot ? createPortal(content, portalRoot) : content;
};

export default SlideOverDrawer;

