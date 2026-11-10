'use client';

import Modal from '@/components/ui/Modal';
import PlanBadge from '@/components/common/PlanBadge';
import { formatPKR } from '@/lib/money';

export default function CollegeBillingDetailModal({
  collegeData = null,
  open = false,
  onClose,
  loading = false,
  onMigratePlan,
}) {
  if (!collegeData && !loading) return null;

  const college = collegeData?.college;
  const limits = collegeData?.limits || {};
  const usage = collegeData?.usage || {};
  const financialSummary = collegeData?.financialSummary || {};
  const accountants = collegeData?.accountants || [];
  const ledger = collegeData?.ledger || [];

  const studentPercent = limits.maxStudents > 0
    ? Math.min(100, Math.round(((usage.students || 0) / limits.maxStudents) * 100))
    : 0;

  const staffPercent = limits.maxStaff > 0
    ? Math.min(100, Math.round(((usage.staff || 0) / limits.maxStaff) * 100))
    : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Institutional Billing Setup: ${college?.name || 'Loading...'}`}
      className="max-w-3xl"
    >
      {loading ? (
        <div className="py-16 text-center text-xs text-t-secondary">
          <div className="size-7 border-2 border-[var(--accent,var(--primary-01))] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading college telemetry &amp; ledger...</span>
        </div>
      ) : (
        <div className="space-y-5 text-xs text-t-primary">
          {/* Header Overview Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-3xl bg-b-surface1 border border-s-subtle">
            <div>
              <span className="text-caption text-t-secondary">Current Plan</span>
              <div className="mt-1">
                <PlanBadge planId={college?.planId || 'starter'} size="sm" />
              </div>
              <div className="text-[11px] font-mono text-t-tertiary mt-0.5">{college?.code}</div>
            </div>

            <div>
              <span className="text-caption text-t-secondary">Derived Billing Price</span>
              <div className="text-h6 font-bold text-t-primary tabular-nums mt-0.5">
                {formatPKR(college?.billingPrice)}
              </div>
              <span className="text-[10px] text-t-tertiary">
                /{college?.billingCycle === 'YEARLY' ? 'year (11x)' : 'month'}
              </span>
            </div>

            <div>
              <span className="text-caption text-t-secondary">Settled Revenue</span>
              <div className="text-h6 font-bold text-emerald-600 tabular-nums mt-0.5">
                {formatPKR(financialSummary.totalSettledRevenue)}
              </div>
              <span className="text-[10px] text-t-tertiary">
                {financialSummary.totalPayments || 0} proofs submitted
              </span>
            </div>

            <div>
              <span className="text-caption text-t-secondary">Period Status</span>
              <div className="mt-1">
                <span className="px-2.5 py-0.5 rounded-full text-caption font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20">
                  {college?.subStatus || 'ACTIVE'}
                </span>
              </div>
              {college?.subscriptionExpiresAt && (
                <div className="text-[10px] text-t-tertiary mt-0.5">
                  Renews: {new Date(college.subscriptionExpiresAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Hard Quota Caps vs Current Usage (from CollegeUsage) */}
          <div className="p-4 rounded-3xl bg-b-surface1 border border-s-subtle space-y-3">
            <h4 className="font-bold text-t-primary text-caption uppercase tracking-wider">
              Enforced Capacity &amp; Resource Usage
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Students usage */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-b-depth2/50 border border-s-subtle">
                <div className="flex items-center justify-between text-caption">
                  <span className="text-t-secondary font-medium">Students Enrolled</span>
                  <span className="font-bold text-t-primary">
                    {usage.students || 0} / {limits.maxStudents || 'Unlimited'}
                  </span>
                </div>
                <div className="w-full bg-b-surface2 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      studentPercent > 90 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${studentPercent}%` }}
                  />
                </div>
                <div className="text-right text-[10px] text-t-tertiary">{studentPercent}% utilized</div>
              </div>

              {/* Staff usage */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-b-depth2/50 border border-s-subtle">
                <div className="flex items-center justify-between text-caption">
                  <span className="text-t-secondary font-medium">Staff &amp; Faculty</span>
                  <span className="font-bold text-t-primary">
                    {usage.staff || 0} / {limits.maxStaff || 'Unlimited'}
                  </span>
                </div>
                <div className="w-full bg-b-surface2 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      staffPercent > 90 ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${staffPercent}%` }}
                  />
                </div>
                <div className="text-right text-[10px] text-t-tertiary">{staffPercent}% utilized</div>
              </div>
            </div>
          </div>

          {/* Assigned Accountants */}
          <div className="p-4 rounded-3xl bg-b-surface1 border border-s-subtle space-y-2">
            <h4 className="font-bold text-t-primary text-caption uppercase tracking-wider">
              Assigned Institutional Accountant(s)
            </h4>
            {accountants.length === 0 ? (
              <p className="text-caption text-t-tertiary italic">
                No accountant account assigned to this institution yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {accountants.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-2.5 rounded-2xl bg-b-depth2 border border-s-subtle flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-t-primary">{acc.name}</div>
                      <div className="text-caption text-t-secondary">{acc.email}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Proof Ledger */}
          <div className="p-4 rounded-3xl bg-b-surface1 border border-s-subtle space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-t-primary text-caption uppercase tracking-wider">
                Historical Payment Ledger
              </h4>
              <span className="text-[11px] text-t-tertiary font-mono">{ledger.length} entries</span>
            </div>

            <div className="max-h-56 overflow-auto rounded-2xl border border-s-subtle divide-y divide-s-subtle bg-b-surface2/40">
              {ledger.length === 0 ? (
                <div className="py-8 text-center text-caption text-t-tertiary">
                  No payment proofs recorded for this institution.
                </div>
              ) : (
                ledger.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-caption">
                    <div>
                      <div className="font-bold text-t-primary font-mono">{item.receiptNumber || item.transactionId || '—'}</div>
                      <div className="text-[11px] text-t-tertiary">
                        {item.paymentMethod || 'Bank Transfer'} &bull; {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-t-primary tabular-nums">
                        {formatPKR(item.verifiedAmount || item.amountPaid)}
                      </div>
                      <span className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-bold ${
                        item.status === 'APPROVED'
                          ? 'text-emerald-600 bg-emerald-500/10'
                          : item.status === 'PENDING'
                            ? 'text-amber-600 bg-amber-500/10'
                            : 'text-red-600 bg-red-500/10'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-s-subtle">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary h-9 px-4 text-caption rounded-2xl cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onMigratePlan(college);
              }}
              className="btn-primary h-9 px-5 text-caption rounded-2xl font-semibold cursor-pointer"
            >
              Change Plan
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

