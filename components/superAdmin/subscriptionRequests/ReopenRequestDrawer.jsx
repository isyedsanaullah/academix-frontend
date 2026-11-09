'use client';

import { useState } from 'react';
import SlideOverDrawer from '@/components/common/SlideOverDrawer';

export default function ReopenRequestDrawer({
  open = false,
  onClose,
  request,
  onConfirm,
  loading = false,
}) {
  const [note, setNote] = useState('');

  if (!request) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    onConfirm(note.trim());
  };

  return (
    <SlideOverDrawer
      open={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      title="Re-open Application"
      subtitle={`Application for ${request.collegeName}`}
      icon="refresh"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-caption font-semibold text-t-secondary hover:text-t-primary hover:bg-b-depth2 border border-s-subtle transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !note.trim()}
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-2xl text-caption font-bold text-white bg-primary-01 hover:bg-primary-01/90 shadow-depth transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Re-opening…' : 'Confirm Re-open'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-4 rounded-2xl bg-b-depth2 border border-s-subtle space-y-1">
          <span className="text-[10px] font-bold text-t-tertiary uppercase tracking-wider">
            Target Institution
          </span>
          <h4 className="text-sub-title-1 font-bold text-t-primary">{request.collegeName}</h4>
          <p className="text-caption text-t-secondary">{request.adminEmail}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-caption text-amber-700 dark:text-amber-300 leading-relaxed">
          Re-opening a declined application moves it back to <strong>Contacted</strong> status so you can continue qualification and provision their institutional workspace. An explanation note is mandatory for compliance audit records.
        </div>

        <div className="space-y-2">
          <label className="text-caption font-semibold text-t-primary block">
            Explanation Note <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain the reason for re-opening (e.g., received updated accreditation documents, applicant clarified capacity needs)…"
            rows={5}
            className="w-full text-caption p-3.5 rounded-2xl bg-b-surface2 border border-s-stroke2 text-t-primary placeholder:text-t-tertiary outline-none focus:border-primary-01 transition"
          />
        </div>
      </form>
    </SlideOverDrawer>
  );
}

