'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon';
import { getAppPortalRoot } from '../../lib/portal';

/**
 * Universal Modal / Drawer component.
 * By default, modals slide in smoothly from the right side, take full height of the viewport,
 * feature a refined close icon button, and include the custom vertical scroller.
 * Can be explicitly centered if needed via `isSlidePanel={false}`.
 */
const Modal = ({
  className = '',
  classWrapper = '',
  open = false,
  onClose,
  title,
  subtitle,
  footer,
  children,
  isSlidePanel = true,
  maxWidth = 'max-w-143',
  width = 'w-full sm:max-w-xl md:max-w-2xl',
}) => {
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const portalRoot = getAppPortalRoot();

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal dialog'}
      data-portal-modal="true"
      className={`fixed inset-0 z-[110] flex ${isSlidePanel ? 'justify-end' : ''}`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-b-surface1/75 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel Container */}
      <div
        className={`relative z-10 flex w-full ${
          isSlidePanel
            ? 'justify-end overflow-hidden h-full'
            : 'items-center justify-center p-4 overflow-y-auto'
        } ${className}`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          data-modal-surface="true"
          className={`relative bg-b-surface2 text-t-primary shadow-dropdown ${
            isSlidePanel
              ? `${width} h-full max-h-screen flex flex-col overflow-hidden animate-slide-left border-l border-s-subtle`
              : `w-full ${maxWidth} m-auto p-8 max-md:p-5 rounded-4xl border border-s-subtle animate-slide-up`
          } ${classWrapper}`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between gap-4 ${
              isSlidePanel
                ? 'px-7 py-6 border-b border-s-subtle bg-b-surface2 shrink-0'
                : 'mb-6 pr-12'
            }`}
          >
            <div className="min-w-0 pr-2">
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

            {/* Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="flex items-center justify-center size-11 rounded-full bg-b-surface1 border border-s-subtle text-t-secondary hover:text-t-primary hover:border-s-highlight transition-all cursor-pointer shrink-0 shadow-widget"
              >
                <Icon
                  className="!size-4 fill-t-secondary transition-colors group-hover:fill-t-primary"
                  name="close"
                />
              </button>
            )}
          </div>

          {/* Body with Custom Vertical Scroller */}
          <div
            className={
              isSlidePanel
                ? 'flex-1 overflow-y-auto px-7 py-6 custom-drawer-scrollbar'
                : ''
            }
          >
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div
              className={`${
                isSlidePanel
                  ? 'px-7 py-4 border-t border-s-subtle bg-b-surface2/90 backdrop-blur-xs shrink-0'
                  : 'mt-6 pt-4 border-t border-s-subtle'
              } flex items-center justify-end gap-3`}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return portalRoot ? createPortal(modalContent, portalRoot) : modalContent;
};

export default Modal;

