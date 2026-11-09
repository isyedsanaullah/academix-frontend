'use client';

import { useState } from 'react';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Icon from '@/components/Icon';
import Modal from '@/components/ui/Modal';
import PlanMigrationDrawer from '@/components/superAdmin/college/PlanMigrationDrawer';
import {
  useCollegeBilling,
  useCollegeBillingDetail,
  useChangePlanMutation
} from '@/features/superAdminFinance/hooks/useFinance';
import { formatPKR } from '@/lib/money';

function CollegeBillingContent() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [planId, setPlanId] = useState('ALL');
  const [subStatus, setSubStatus] = useState('ALL');
  const [includeTest, setIncludeTest] = useState(false);

  // Detail Modal
  const [detailCollegeId, setDetailCollegeId] = useState(null);

  // Plan Change Drawer State
  const [migrationTarget, setMigrationTarget] = useState(null);

  const { data, isLoading } = useCollegeBilling({
    page,
    limit: 20,
    q: q.trim() || undefined,
    planId: planId !== 'ALL' ? planId : undefined,
    subStatus: subStatus !== 'ALL' ? subStatus : undefined,
    includeTest
  });

  const { data: detailData, isLoading: detailLoading } = useCollegeBillingDetail(detailCollegeId);
  const changePlanMutation = useChangePlanMutation();

  const colleges = data?.colleges || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-t-primary">Per-College Billing</h1>
          <p className="text-sm text-t-secondary mt-0.5">
            Institutional billing setups, derived pricing tiers, quotas, and ledger history.
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs text-t-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeTest}
            onChange={(e) => {
              setIncludeTest(e.target.checked);
              setPage(1);
            }}
            className="rounded border-s-stroke bg-b-surface1 text-accent focus:ring-accent"
          />
          Include Test Data
        </label>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search college name or code..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-b-surface2 border border-s-stroke text-t-primary focus:border-accent focus:outline-none"
          />
          <Icon name="search" className="w-4 h-4 text-t-tertiary absolute left-2.5 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={planId}
            onChange={(e) => {
              setPlanId(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 text-xs rounded-xl bg-b-surface2 border border-s-stroke text-t-primary focus:border-accent focus:outline-none"
          >
            <option value="ALL">All Plans</option>
            <option value="starter">Starter</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select
            value={subStatus}
            onChange={(e) => {
              setSubStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 text-xs rounded-xl bg-b-surface2 border border-s-stroke text-t-primary focus:border-accent focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIAL">Trial</option>
            <option value="EXPIRED">Expired</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Colleges Billing Table */}
      <div className="card p-0 overflow-hidden border border-s-stroke">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-t-primary">
            <thead className="bg-b-surface2/60 text-t-secondary border-b border-s-stroke uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4">Current Plan</th>
                <th className="py-3 px-4">Cycle</th>
                <th className="py-3 px-4">Derived Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Settled Revenue</th>
                <th className="py-3 px-4">Latest Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-s-stroke">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-t-secondary">
                    Loading college billing setups...
                  </td>
                </tr>
              ) : colleges.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-t-secondary">
                    No colleges found.
                  </td>
                </tr>
              ) : (
                colleges.map((c) => (
                  <tr key={c.id} className="hover:bg-b-surface2/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-t-primary">{c.name}</div>
                      <div className="text-[11px] text-t-tertiary font-mono">{c.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-medium text-t-primary">{c.planId}</span>
                      {c.pendingDowngradePlanId && (
                        <div className="text-[10px] text-amber-600 font-medium">
                          Downgrade to {c.pendingDowngradePlanId} scheduled
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-t-secondary">
                      {c.billingCycle}
                    </td>
                    <td className="py-3 px-4 font-bold text-t-primary">
                      {formatPKR(c.billingPrice)}
                      <span className="text-[10px] text-t-tertiary font-normal">
                        /{c.billingCycle === 'YEARLY' ? 'yr' : 'mo'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        c.subStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' :
                        c.subStatus === 'TRIAL' ? 'bg-blue-500/10 text-blue-600' :
                        c.subStatus === 'EXPIRED' ? 'bg-red-500/10 text-red-600' :
                        'bg-amber-500/10 text-amber-600'
                      }`}>
                        {c.subStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">
                      {formatPKR(c.totalSettledRevenue)}
                    </td>
                    <td className="py-3 px-4 text-t-secondary text-[11px]">
                      {c.latestPaymentDate
                        ? new Date(c.latestPaymentDate).toLocaleDateString('en-PK', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailCollegeId(c.id)}
                          className="btn-secondary h-7 px-2.5 text-[11px] rounded-lg"
                        >
                          Ledger &amp; Setup
                        </button>
                        <button
                          onClick={() => setMigrationTarget(c)}
                          className="btn-primary h-7 px-2.5 text-[11px] rounded-lg"
                        >
                          Change Plan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-b-surface2/30 border-t border-s-stroke flex items-center justify-between text-xs text-t-secondary">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.total, pagination.page * pagination.limit)} of {pagination.total} colleges
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary h-7 px-2.5 text-xs rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 font-medium">
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="btn-secondary h-7 px-2.5 text-xs rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* College Billing Detail Modal */}
      {detailCollegeId && (
        <Modal
          open={Boolean(detailCollegeId)}
          onClose={() => setDetailCollegeId(null)}
          title={`Billing Ledger: ${detailData?.college?.name || 'Loading...'}`}
        >
          {detailLoading ? (
            <div className="py-12 text-center text-xs text-t-secondary">Loading details...</div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Setup Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-b-surface2 border border-s-stroke">
                <div>
                  <span className="text-t-tertiary">Current Tier:</span>
                  <div className="font-bold text-t-primary capitalize">{detailData?.college?.planId}</div>
                </div>
                <div>
                  <span className="text-t-tertiary">Derived Price:</span>
                  <div className="font-bold text-t-primary">{formatPKR(detailData?.college?.billingPrice)}</div>
                </div>
                <div>
                  <span className="text-t-tertiary">Total Settled:</span>
                  <div className="font-bold text-emerald-600">{formatPKR(detailData?.financialSummary?.totalSettledRevenue)}</div>
                </div>
                <div>
                  <span className="text-t-tertiary">Students Enrolled:</span>
                  <div className="font-semibold text-t-primary">
                    {detailData?.usage?.students} / {detailData?.limits?.maxStudents}
                  </div>
                </div>
              </div>

              {/* Assigned Accountants */}
              <div className="space-y-1.5">
                <span className="text-t-secondary font-semibold">Assigned Accountant(s):</span>
                {detailData?.accountants?.length === 0 ? (
                  <p className="text-t-tertiary italic">No accountant user assigned to this college.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {detailData?.accountants?.map((a) => (
                      <span key={a.id} className="px-2.5 py-1 rounded-lg bg-b-surface2 border border-s-stroke text-t-primary">
                        {a.name} ({a.email})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Ledger Items */}
              <div className="space-y-1.5">
                <span className="text-t-secondary font-semibold">Payment History Ledger:</span>
                <div className="max-h-60 overflow-auto rounded-xl border border-s-stroke divide-y divide-s-stroke">
                  {detailData?.ledger?.length === 0 ? (
                    <div className="p-4 text-center text-t-tertiary">No payment proofs recorded.</div>
                  ) : (
                    detailData?.ledger?.map((item) => (
                      <div key={item.id} className="p-2.5 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-semibold text-t-primary">{formatPKR(item.amountPaid)}</span>
                          <span className="text-t-tertiary ml-2">TID: {item.transactionId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600' :
                            item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-red-500/10 text-red-600'
                          }`}>
                            {item.status}
                          </span>
                          <span className="text-t-tertiary">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Plan Migration Drawer */}
      {migrationTarget && (
        <PlanMigrationDrawer
          open={Boolean(migrationTarget)}
          onClose={() => setMigrationTarget(null)}
          collegeId={migrationTarget.id}
          collegeName={migrationTarget.name}
          currentPlan={migrationTarget.planId}
          targetPlan={migrationTarget.planId === 'premium' ? 'enterprise' : 'premium'}
          onConfirmed={() => setMigrationTarget(null)}
        />
      )}
    </div>
  );
}

export default function PerCollegeBillingPage() {
  return (
    <AuthGuard allowedRoles={['superAdmin']}>
      <DashboardLayout>
        <CollegeBillingContent />
      </DashboardLayout>
    </AuthGuard>
  );
}

