'use client';

import { useState } from 'react';
import SlideOverDrawer from '@/components/common/SlideOverDrawer';

export default function RejectRequestDrawer({
  open = false,
  onClose,
  request,
  onConfirm,
  loading = false,
}) {
  const [reason, setReason] = useState('');
  const [notifyRequester, setNotifyRequester] = useState(true);

  if (!request) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim().length < 5) return;
    onConfirm({ reason: reason.trim(), notifyRequester });
  };

  return (
    <SlideOverDrawer
      open={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      title="Reject Subscription Request"
      subtitle={`Application for ${request.collegeName}`}
      icon="close"
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
            disabled={loading || reason.trim().length < 5}
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-2xl text-caption font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-depth transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Rejecting…' : 'Reject Application'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-4 rounded-2xl bg-b-depth2 border border-s-subtle space-y-1">
          <span className="text-[10px] font-bold text-t-tertiary uppercase tracking-wider">
            Applicant
          </span>
          <h4 className="text-sub-title-1 font-bold text-t-primary">{request.collegeName}</h4>
          <p className="text-caption text-t-secondary">{request.adminEmail}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-caption font-semibold text-t-primary">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-mono text-t-tertiary">
              {reason.length} / 500 characters
            </span>
          </div>
          <textarea
            required
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Incomplete institutional documentation or duplicate submission…"
            rows={5}
            className="w-full text-caption p-3.5 rounded-2xl bg-b-surface2 border border-s-stroke2 text-t-primary placeholder:text-t-tertiary outline-none focus:border-rose-500 transition"
          />
          <p className="text-[11px] text-t-secondary">Minimum 5 characters required for audit trail.</p>
        </div>

        <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-b-depth2 border border-s-subtle cursor-pointer select-none">
          <input
            type="checkbox"
            checked={notifyRequester}
            onChange={(e) => setNotifyRequester(e.target.checked)}
            className="mt-0.5 rounded text-primary-01 focus:ring-primary-01"
          />
          <div className="text-caption">
            <span className="font-semibold text-t-primary block">
              Send notification email to applicant
            </span>
            <span className="text-t-secondary text-[11px] block mt-0.5">
              Dispatches an automated decline notice to {request.adminEmail}.
            </span>
          </div>
        </label>
      </form>
    </SlideOverDrawer>
  );
}

