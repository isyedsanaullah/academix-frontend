'use client';

import Modal from '@/components/ui/Modal';
import PlanBadge from '@/components/common/PlanBadge';
import { formatPKR } from '@/lib/money';

export default function AccountantDetailModal({
  accountant = null,
  open = false,
  onClose,
}) {
  if (!accountant) return null;

  const college = accountant.college;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Accountant Profile: ${accountant.name}`}
      className="max-w-xl"
    >
      <div className="space-y-5 text-xs text-t-primary">
        {/* Accountant Card */}
        <div className="p-4 rounded-3xl bg-b-surface1 border border-s-subtle flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-b-depth2 border border-s-subtle flex items-center justify-center font-bold text-h6 text-t-secondary shrink-0">
            {accountant.name?.slice(0, 2).toUpperCase() || 'AC'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sub-title-1 text-t-primary truncate">{accountant.name}</h3>
            <p className="text-caption text-t-secondary font-mono">{accountant.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                accountant.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
              }`}>
                {accountant.isActive ? 'Active Account' : 'Inactive'}
              </span>
              {accountant.totpEnabled && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600">
                  2FA Enrolled
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Assigned College Card */}
        <div className="p-4 rounded-3xl bg-b-surface1 border border-s-subtle space-y-3">
          <h4 className="font-bold text-caption uppercase tracking-wider text-t-secondary">
            Assigned Educational Institution
          </h4>

          {college ? (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-b-depth2/50 border border-s-subtle">
              <div>
                <span className="text-caption text-t-secondary">College Name</span>
                <div className="font-bold text-t-primary mt-0.5">{college.name}</div>
                <div className="text-[11px] font-mono text-t-tertiary">{college.code}</div>
              </div>
              <div>
                <span className="text-caption text-t-secondary">Plan Tier / Pricing</span>
                <div className="mt-1">
                  <PlanBadge planId={college.planId || 'starter'} size="sm" />
                </div>
                <div className="text-[11px] font-bold text-t-primary mt-1">
                  {formatPKR(college.billingPrice)}/{college.billingCycle === 'YEARLY' ? 'yr' : 'mo'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center rounded-2xl bg-b-depth2 text-caption text-t-tertiary italic">
              This accountant is currently not assigned to any specific college tenant.
            </div>
          )}
        </div>

        {/* Contact & Security Metadata */}
        <div className="grid grid-cols-2 gap-3 text-caption p-4 rounded-3xl bg-b-surface1 border border-s-subtle">
          <div>
            <span className="text-t-secondary">Phone Contact:</span>
            <div className="font-medium text-t-primary mt-0.5">{accountant.phone || '—'}</div>
          </div>
          <div>
            <span className="text-t-secondary">Last Login Timestamp:</span>
            <div className="font-mono text-t-primary mt-0.5">
              {accountant.lastLogin ? new Date(accountant.lastLogin).toLocaleString('en-PK') : 'Never logged in'}
            </div>
          </div>
          <div>
            <span className="text-t-secondary">Account Created:</span>
            <div className="font-mono text-t-primary mt-0.5">
              {new Date(accountant.createdAt).toLocaleDateString('en-PK')}
            </div>
          </div>
          <div>
            <span className="text-t-secondary">System Role:</span>
            <div className="font-bold text-t-primary mt-0.5 capitalize">{accountant.role}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-s-subtle">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary h-9 px-4 text-caption rounded-2xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

