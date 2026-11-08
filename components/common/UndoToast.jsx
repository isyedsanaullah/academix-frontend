'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon';
import { getAppPortalRoot } from '../../lib/portal';

/**
 * UndoToast — Tokenised Core 2.0 5-second Undo notification portaled inside #app-portal-root
 */
export default function UndoToast({
  message,
  operationId,
  onUndo,
  onClose,
  duration = 5000,
}) {
  const [progress, setProgress] = useState(100);
  const [undoing, setUndoing] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setDone(true);
      onClose?.();
    }, duration);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [duration, onClose]);

  const handleUndo = async () => {
    if (undoing || done) return;
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    setUndoing(true);
    try {
      await onUndo(operationId);
    } catch (err) {
      console.error('[UndoToast] Undo failed:', err?.response?.data?.message || err.message);
    } finally {
      setDone(true);
      onClose?.();
    }
  };

  const handleClose = () => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    setDone(true);
    onClose?.();
  };

  if (done) return null;

  const portalRoot = getAppPortalRoot();
  const content = (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] min-w-[340px] max-w-[480px] rounded-3xl bg-b-surface2 border border-s-stroke2 shadow-dropdown overflow-hidden"
    >
      <div
        className="h-1 transition-all duration-75"
        style={{
          background: `linear-gradient(90deg, var(--primary-01) ${progress}%, transparent ${progress}%)`,
        }}
      />
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-b-surface1 border border-s-subtle shrink-0">
          <Icon name="trash" className="!size-4.5 fill-t-secondary" />
        </div>
        <p className="flex-1 text-body-2 text-t-primary leading-snug">{message}</p>
        <button
          type="button"
          onClick={handleUndo}
          disabled={undoing}
          className="h-9 px-4 rounded-full bg-primary-01/12 border border-primary-01/30 text-t-blue text-caption font-semibold hover:bg-primary-01/20 transition cursor-pointer disabled:opacity-50"
        >
          {undoing ? 'Reverting…' : 'Undo'}
        </button>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Dismiss notification"
          className="p-1.5 rounded-full text-t-tertiary hover:text-t-primary transition cursor-pointer"
        >
          <Icon name="close" className="!size-4 fill-current" />
        </button>
      </div>
    </div>
  );

  return portalRoot ? createPortal(content, portalRoot) : content;
}
