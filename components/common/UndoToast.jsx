'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * UndoToast
 * Generic 5-second Undo notification for soft deletes and status transitions.
 *
 * Props:
 *  - message    {string}   - Toast message to display (e.g. "Assignment deleted.")
 *  - operationId {string}  - Exact operation ID to send on Undo (never guessed by frontend)
 *  - onUndo     {Function} - async callback(operationId) called when user clicks Undo
 *  - onClose    {Function} - called when toast dismisses (by timeout or close)
 *  - duration   {number}   - Undo window in ms (default 5000)
 */
export default function UndoToast({ message, operationId, onUndo, onClose, duration = 5000 }) {
  const [progress, setProgress] = useState(100);
  const [undoing, setUndoing] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Animate progress bar
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    // Auto-dismiss after duration
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setDone(true);
      onClose?.();
    }, duration);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

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

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        minWidth: '340px',
        maxWidth: '480px',
        background: 'rgba(22, 24, 36, 0.97)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          height: '3px',
          background: `linear-gradient(90deg, #818cf8 ${progress}%, rgba(255,255,255,0.06) ${progress}%)`,
          transition: 'background 0.05s linear',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
        {/* Icon */}
        <span style={{ fontSize: '18px', flexShrink: 0 }}>🗑️</span>

        {/* Message */}
        <p style={{ flex: 1, fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.4 }}>
          {message}
        </p>

        {/* Undo button */}
        <button
          onClick={handleUndo}
          disabled={undoing}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(129,140,248,0.5)',
            background: 'rgba(129,140,248,0.12)',
            color: '#818cf8',
            fontSize: '12px',
            fontWeight: 600,
            cursor: undoing ? 'not-allowed' : 'pointer',
            transition: 'all 0.12s',
            flexShrink: 0,
            letterSpacing: '0.03em',
          }}
        >
          {undoing ? 'Reverting…' : 'Undo'}
        </button>

        {/* Dismiss button */}
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '16px',
            padding: '0 2px',
            lineHeight: 1,
            flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
