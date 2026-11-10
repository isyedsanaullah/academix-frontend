'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/Icon';
import PlanBadge from '@/components/common/PlanBadge';
import { formatPKR } from '@/lib/money';

export default function PaymentDetailModal({
  payment = null,
  open = false,
  onClose,
  onApprove,
  onReject,
  actionLoading = false,
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  if (!payment) return null;

  const isPending = payment.status === 'PENDING';

  const handleConfirmReject = () => {
    if (!reason.trim()) return;
    onReject(payment.id, reason.trim());
    setRejecting(false);
    setReason('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Payment Proof: ${payment.receiptNumber || payment.transactionId || payment.id.slice(0, 8)}`}
      className="max-w-2xl"
    >
      <div className="space-y-5 text-xs text-t-primary">
        {/* Suspected Duplicate Banner */}
        {payment.isDuplicateSuspected && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-start gap-3">
            <Icon name="warning" className="!size-5 fill-current shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Suspected Duplicate Transaction</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Another payment with the same transaction ID or same amount was recently submitted for this college.
              </p>
            </div>
          </div>
        )}

        {/* Institution & Payment Key Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-3xl bg-b-surface1 border border-s-subtle">
          <div>
            <span className="text-caption text-t-secondary">College</span>
            <div className="font-bold text-t-primary mt-0.5">{payment.college?.name || '—'}</div>
            <div className="font-mono text-[11px] text-t-tertiary">{payment.college?.code}</div>
          </div>
          <div>
            <span className="text-caption text-t-secondary">Plan / Cycle</span>
            <div className="mt-1">
              <PlanBadge planId={payment.planId || 'starter'} size="sm" />
            </div>
            <div className="text-[11px] text-t-tertiary font-mono mt-0.5">{payment.billingCycle || 'MONTHLY'}</div>
          </div>
          <div>
            <span className="text-caption text-t-secondary">Amount Paid</span>
            <div className="text-h6 font-bold text-t-primary tabular-nums mt-0.5">
              {formatPKR(payment.amountPaid)}
            </div>
            {payment.verifiedAmount && payment.verifiedAmount !== payment.amountPaid && (
              <div className="text-[11px] text-emerald-600 font-semibold">
                Settled: {formatPKR(payment.verifiedAmount)}
              </div>
            )}
          </div>
          <div>
            <span className="text-caption text-t-secondary">Status</span>
            <div className="mt-1">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-caption font-bold ${
                  payment.status === 'APPROVED'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20'
                    : payment.status === 'PENDING'
                      ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20'
                      : 'bg-red-500/10 text-red-600 dark:bg-red-500/20'
                }`}
              >
                {payment.status}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Metadata */}
        <div className="grid grid-cols-2 gap-3 text-caption p-3.5 rounded-2xl bg-b-surface1 border border-s-subtle">
          <div>
            <span className="text-t-secondary">Bank Method:</span>
            <span className="ml-2 font-semibold text-t-primary uppercase">{payment.paymentMethod || '—'}</span>
          </div>
          <div>
            <span className="text-t-secondary">Transaction ID / TID:</span>
            <span className="ml-2 font-mono font-bold text-t-primary">{payment.transactionId || '—'}</span>
          </div>
          <div>
            <span className="text-t-secondary">Submitted By:</span>
            <span className="ml-2 text-t-primary font-medium">{payment.submittedBy || '—'}</span>
          </div>
          <div>
            <span className="text-t-secondary">Submission Date:</span>
            <span className="ml-2 text-t-primary">
              {new Date(payment.createdAt).toLocaleString('en-PK')}
            </span>
          </div>
        </div>

        {/* Payment Proof Receipt Image Preview */}
        {payment.screenshotUrl && (
          <div className="space-y-1.5">
            <span className="text-caption font-semibold text-t-secondary">
              Attached Bank Transfer Proof:
            </span>
            <div className="max-h-[380px] overflow-auto rounded-2xl border border-s-subtle bg-b-depth2 p-2 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.screenshotUrl}
                alt="Payment proof screenshot"
                className="max-h-[360px] w-auto rounded-xl object-contain shadow-xs"
              />
            </div>
          </div>
        )}

        {/* Rejection Reason Form */}
        {rejecting ? (
          <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-3">
            <p className="font-semibold text-red-600">Enter Rejection Reason for College Admin:</p>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Transaction ID was not found on Raast bank ledger..."
              className="w-full p-3 text-xs rounded-xl bg-b-surface1 border border-s-subtle text-t-primary focus:border-red-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejecting(false)}
                className="btn-secondary h-8 px-3 text-caption rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!reason.trim() || actionLoading}
                className="btn-primary h-8 px-3 text-caption bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        ) : (
          isPending && (
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-s-subtle">
              <button
                type="button"
                onClick={() => setRejecting(true)}
                disabled={actionLoading}
                className="btn-secondary h-9 px-4 text-caption text-red-600 hover:bg-red-500/10 rounded-2xl font-semibold"
              >
                Reject Proof
              </button>
              <button
                type="button"
                onClick={() => onApprove(payment.id)}
                disabled={actionLoading}
                className="btn-primary h-9 px-5 text-caption bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold shadow-xs"
              >
                Approve &amp; Settle Revenue
              </button>
            </div>
          )
        )}
      </div>
    </Modal>
  );
}

