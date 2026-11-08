'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon';
import { getAppPortalRoot } from '../../lib/portal';

const Modal = ({
  className = '',
  classWrapper = '',
  open = false,
  onClose,
  title,
  subtitle,
  footer,
  children,
  isSlidePanel = false,
  maxWidth = 'max-w-143',
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const portalRoot = getAppPortalRoot();

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal dialog'}
      data-portal-modal="true"
      className="fixed inset-0 z-[110] flex"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-b-surface1/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel Container */}
      <div
        className={`relative z-10 flex w-full ${
          isSlidePanel
            ? 'justify-end overflow-hidden'
            : 'items-center justify-center p-4 overflow-y-auto'
        } ${className}`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          data-modal-surface="true"
          className={`relative bg-b-surface2 text-t-primary border border-s-subtle shadow-dropdown ${
            isSlidePanel
              ? 'w-114 max-md:w-full h-svh flex flex-col overflow-hidden'
              : `w-full ${maxWidth} m-auto p-8 max-md:p-5 rounded-4xl`
          } ${classWrapper}`}
        >
          {/* Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="group absolute right-5 top-5 z-20 flex items-center justify-center size-11 rounded-full bg-b-surface1 border border-s-subtle text-t-secondary hover:text-t-primary hover:border-s-highlight transition-colors cursor-pointer"
            >
              <Icon
                className="!size-5 fill-t-secondary transition-colors group-hover:fill-t-primary"
                name="close"
              />
            </button>
          )}

          {/* Optional Header */}
          {(title || subtitle) && (
            <div
              className={`${
                isSlidePanel
                  ? 'px-7 pt-6 pb-4 border-b border-s-subtle pr-18'
                  : 'mb-6 pr-12'
              }`}
            >
              {title && <h2 className="text-h5 text-t-primary">{title}</h2>}
              {subtitle && (
                <p className="mt-1 text-body-2 text-t-secondary">{subtitle}</p>
              )}
            </div>
          )}

          {/* Body */}
          <div
            className={
              isSlidePanel ? 'flex-1 overflow-y-auto px-7 py-5' : ''
            }
          >
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div
              className={`${
                isSlidePanel
                  ? 'px-7 py-4 border-t border-s-subtle bg-b-surface2'
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

