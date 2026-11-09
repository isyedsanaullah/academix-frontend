'use client';

import { useState } from 'react';
import SlideOverDrawer from '@/components/common/SlideOverDrawer';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import toast from 'react-hot-toast';
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDocumentDuplicate,
  HiOutlineRefresh,
} from 'react-icons/hi';

const PLAN_LABELS = {
  free: 'Free Trial',
  starter: 'Starter Plan',
  basic: 'Basic Plan',
  standard: 'Standard Plan',
  premium: 'Premium Plan',
  enterprise: 'Enterprise Plan',
};

export default function RequestDetailDrawer({
  open = false,
  onClose,
  request,
  loading = false,
  inviteStatus,
  inviteLoading = false,
  onAddNote,
  onMarkContacted,
  onOpenApprove,
  onOpenReject,
  onReopen,
  onResendInvite,
  actionLoading = false,
}) {
  const [noteInput, setNoteInput] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  if (!request) return null;

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    await onAddNote(noteInput.trim());
    setNoteInput('');
  };

  const status = (request.status || 'new').toLowerCase();

  return (
    <SlideOverDrawer
      open={open}
      onClose={onClose}
      title={request.collegeName || 'Subscription Request'}
      subtitle={`Application ID: ${request.id?.slice(0, 8)}`}
      icon="document"
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-caption font-semibold rounded-xl bg-b-depth2 hover:bg-b-depth1 text-t-secondary hover:text-t-primary border border-s-subtle transition cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {status === 'new' && (
              <button
                type="button"
                onClick={() => onMarkContacted(request)}
                disabled={actionLoading}
                className="px-4 py-2 text-caption font-bold rounded-xl bg-primary-01 hover:bg-primary-01/90 text-white shadow-depth transition cursor-pointer disabled:opacity-60"
              >
                Mark Contacted
              </button>
            )}

            {status === 'contacted' && (
              <button
                type="button"
                onClick={() => onOpenApprove(request)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-caption font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-depth transition cursor-pointer disabled:opacity-60"
              >
                <HiOutlineSparkles size={15} />
                <span>Approve & Provision</span>
              </button>
            )}

            {status !== 'rejected' && status !== 'approved' && (
              <button
                type="button"
                onClick={() => onOpenReject(request)}
                disabled={actionLoading}
                className="px-3 py-2 text-caption font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition cursor-pointer disabled:opacity-60"
              >
                Reject Request
              </button>
            )}

            {status === 'rejected' && (
              <button
                type="button"
                onClick={() => onReopen(request)}
                disabled={actionLoading}
                className="px-4 py-2 text-caption font-semibold rounded-xl bg-b-depth2 hover:bg-b-depth1 text-t-primary border border-s-stroke2 transition cursor-pointer disabled:opacity-60"
              >
                Re-open Application
              </button>
            )}
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="py-12">
          <CollegesHubLoader
            size="md"
            text="Loading request details…"
            minHeight="min-h-[220px]"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Badge + Submission Date Banner */}
          <div className="p-4 rounded-2xl bg-b-depth2 border border-s-subtle flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-t-tertiary block">
                Current Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                {status === 'new' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-bold bg-[#EF9D0E]/15 text-[#EF9D0E] border border-[#EF9D0E]/25">
                    <span className="size-1.5 rounded-full bg-[#EF9D0E]" />
                    NEW REQUEST
                  </span>
                )}
                {status === 'contacted' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-bold bg-[#0B4D94]/15 text-[#0B4D94] border border-[#0B4D94]/25">
                    <span className="size-1.5 rounded-full bg-[#0B4D94]" />
                    CONTACTED
                  </span>
                )}
                {status === 'approved' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-bold bg-[#00a656]/15 text-[#00a656] border border-[#00a656]/25">
                    <span className="size-1.5 rounded-full bg-[#00a656]" />
                    PROVISIONED
                  </span>
                )}
                {status === 'rejected' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-bold bg-[#ff381c]/15 text-[#ff381c] border border-[#ff381c]/25">
                    <span className="size-1.5 rounded-full bg-[#ff381c]" />
                    REJECTED
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-t-tertiary block">
                Submitted At
              </span>
              <span className="text-caption font-mono text-t-secondary mt-1 block">
                {new Date(request.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Contact Details Card: ALWAYS shows BOTH Email and Phone */}
          <div className="p-5 rounded-2xl bg-b-surface2 border border-s-subtle shadow-widget space-y-4">
            <h4 className="text-caption font-bold uppercase tracking-wider text-t-secondary">
              Applicant & Contact Information
            </h4>

            <div className="space-y-3 text-caption">
              {/* Administrator Email */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-b-depth2 border border-s-subtle">
                <div className="flex items-center gap-2.5 min-w-0">
                  <HiOutlineMail className="size-4 text-primary-01 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-t-tertiary block">Administrator Email</span>
                    <span className="font-semibold text-t-primary truncate block">
                      {request.adminEmail || 'Not provided'}
                    </span>
                  </div>
                </div>
                {request.adminEmail && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(request.adminEmail, 'Email')}
                    className="p-1.5 rounded-lg bg-b-surface2 hover:bg-b-depth1 text-t-secondary hover:text-t-primary border border-s-stroke2 transition cursor-pointer"
                    title="Copy email"
                  >
                    <HiOutlineDocumentDuplicate size={14} />
                  </button>
                )}
              </div>

              {/* Contact Phone Number */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-b-depth2 border border-s-subtle">
                <div className="flex items-center gap-2.5 min-w-0">
                  <HiOutlinePhone className="size-4 text-primary-01 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-t-tertiary block">Phone Number</span>
                    <span className="font-semibold text-t-primary font-mono block">
                      {request.phone || 'Not provided'}
                    </span>
                  </div>
                </div>
                {request.phone && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(request.phone, 'Phone')}
                    className="p-1.5 rounded-lg bg-b-surface2 hover:bg-b-depth1 text-t-secondary hover:text-t-primary border border-s-stroke2 transition cursor-pointer"
                    title="Copy phone"
                  >
                    <HiOutlineDocumentDuplicate size={14} />
                  </button>
                )}
              </div>

              {/* Plan & Capacity Overview */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-b-depth2 border border-s-subtle">
                  <span className="text-[10px] text-t-tertiary block">Requested Plan</span>
                  <span className="font-bold text-t-primary capitalize mt-0.5 block">
                    {PLAN_LABELS[request.selectedPlan?.toLowerCase()] || request.selectedPlan}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-b-depth2 border border-s-subtle">
                  <span className="text-[10px] text-t-tertiary block">Expected Capacity</span>
                  <span className="font-bold text-t-primary font-mono mt-0.5 block">
                    {request.studentCount ? `${request.studentCount.toLocaleString()} Students` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* If Approved: Provisioned Workspace Card */}
          {status === 'approved' && (
            <div className="p-5 rounded-2xl bg-[#00a656]/5 border border-[#00a656]/20 shadow-widget space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#00a656] uppercase tracking-wider text-[11px]">
                  Provisioned Workspace
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#00a656]/15 text-[#00a656]">
                  Active Setup
                </span>
              </div>
              <p className="text-caption text-t-secondary leading-relaxed">
                Workspace provisioned on Hostinger platform. The administrator was issued a 7-day single-use onboarding credential.
              </p>

              {inviteStatus && (
                <div className="border-t border-[#00a656]/15 pt-2.5 space-y-1.5 text-caption">
                  <div className="flex justify-between">
                    <span className="text-t-secondary">Invite Link Status:</span>
                    <span className="font-semibold capitalize text-t-primary">{inviteStatus.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-t-secondary">Email Dispatch:</span>
                    <span
                      className={`font-semibold capitalize ${
                        inviteStatus.emailStatus === 'failed' ? 'text-rose-500' : 'text-[#00a656]'
                      }`}
                    >
                      {inviteStatus.emailStatus}
                    </span>
                  </div>
                </div>
              )}

              {request.collegeId && (
                <button
                  type="button"
                  onClick={() => onResendInvite(request.collegeId)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-caption font-bold rounded-xl bg-b-surface2 border border-s-stroke2 hover:bg-b-depth1 text-t-primary transition cursor-pointer"
                >
                  <HiOutlineRefresh size={14} />
                  <span>Resend Setup Invite Email</span>
                </button>
              )}
            </div>
          )}

          {/* Applicant Message */}
          {request.message && (
            <div className="p-4 rounded-2xl bg-b-surface2 border border-s-subtle space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-t-tertiary">
                Message from Applicant
              </h4>
              <p className="text-caption text-t-primary leading-relaxed whitespace-pre-wrap">
                {request.message}
              </p>
            </div>
          )}

          {/* Rejection Reason Notice */}
          {status === 'rejected' && request.rejection_reason && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
                Rejection Reason
              </h4>
              <p className="text-caption text-rose-700 dark:text-rose-300 leading-relaxed whitespace-pre-wrap">
                {request.rejection_reason}
              </p>
            </div>
          )}

          {/* Lifecycle & Activity Timeline */}
          <div className="space-y-3">
            <h4 className="text-caption font-bold uppercase tracking-wider text-t-secondary">
              Lifecycle & Activity Timeline
            </h4>
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-s-subtle">
              {request.events && request.events.length > 0 ? (
                request.events.map((ev) => (
                  <div key={ev.id} className="relative text-caption">
                    <div className="absolute -left-6 top-1 size-2.5 rounded-full bg-primary-01 border-2 border-b-surface2" />
                    <div className="flex items-center justify-between text-[11px] text-t-tertiary">
                      <span className="font-semibold text-t-primary capitalize">
                        {ev.type?.replace('_', ' ')}
                      </span>
                      <span className="font-mono">
                        {new Date(ev.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-t-secondary mt-0.5">
                      Actor: <strong className="text-t-primary">{ev.actor_name || 'System'}</strong>
                    </p>
                    {ev.note && (
                      <p className="bg-b-depth2 p-2 rounded-xl text-t-primary mt-1 text-[11px] border border-s-subtle whitespace-pre-wrap">
                        {ev.note}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-caption text-t-tertiary">No timeline events recorded yet.</p>
              )}
            </div>
          </div>

          {/* Add Administrative Note Form */}
          <form
            onSubmit={handleNoteSubmit}
            className="p-4 rounded-2xl bg-b-depth2 border border-s-subtle space-y-2.5"
          >
            <label className="text-caption font-semibold text-t-primary block">
              Add Administrative Note
            </label>
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Write an internal note about this applicant or conversation…"
              className="w-full text-caption p-3 rounded-xl bg-b-surface2 border border-s-stroke2 text-t-primary placeholder:text-t-tertiary h-20 outline-none focus:border-primary-01 transition"
            />
            <button
              type="submit"
              disabled={!noteInput.trim() || actionLoading}
              className="w-full py-2 px-4 rounded-xl text-caption font-bold bg-primary-01 hover:bg-primary-01/90 disabled:opacity-50 text-white shadow-depth transition cursor-pointer"
            >
              {actionLoading ? 'Saving…' : 'Save Internal Note'}
            </button>
          </form>
        </div>
      )}
    </SlideOverDrawer>
  );
}

