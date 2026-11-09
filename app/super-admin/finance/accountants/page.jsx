'use client';

import { useState } from 'react';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Icon from '@/components/Icon';
import { useAccountants } from '@/features/superAdminFinance/hooks/useFinance';
import { formatPKR } from '@/lib/money';

function AccountantsContent() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ALL');
  const [includeTest, setIncludeTest] = useState(false);

  const { data, isLoading } = useAccountants({
    page,
    limit: 20,
    q: q.trim() || undefined,
    status: status !== 'ALL' ? status.toLowerCase() : undefined,
    includeTest
  });

  const accountants = data?.accountants || [];
  const metrics = data?.metrics || {
    totalAccountants: 0,
    assignedCount: 0,
    unassignedCount: 0,
    totalColleges: 0,
    collegesWithAccountant: 0,
    coveragePercentage: 0
  };
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-t-primary">Accountant Details</h1>
          <p className="text-sm text-t-secondary mt-0.5">
            Institutional finance officers and institutional treasury account assignments.
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

      {/* Coverage KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-b-surface1 border border-s-stroke">
          <div className="text-xs text-t-secondary font-medium">Total Accountants</div>
          <div className="text-xl font-bold text-t-primary mt-1">{metrics.totalAccountants}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="text-xs text-emerald-600 font-medium">Assigned to College</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{metrics.assignedCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <div className="text-xs text-blue-600 font-medium">Colleges Covered</div>
          <div className="text-xl font-bold text-blue-600 mt-1">
            {metrics.collegesWithAccountant} <span className="text-xs font-normal text-t-tertiary">/ {metrics.totalColleges}</span>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <div className="text-xs text-purple-600 font-medium">Coverage Rate</div>
          <div className="text-xl font-bold text-purple-600 mt-1">{metrics.coveragePercentage}%</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search accountant by name or email..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-b-surface2 border border-s-stroke text-t-primary focus:border-accent focus:outline-none"
          />
          <Icon name="search" className="w-4 h-4 text-t-tertiary absolute left-2.5 top-2.5" />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-9 px-3 text-xs rounded-xl bg-b-surface2 border border-s-stroke text-t-primary focus:border-accent focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Accountants Table */}
      <div className="card p-0 overflow-hidden border border-s-stroke">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-t-primary">
            <thead className="bg-b-surface2/60 text-t-secondary border-b border-s-stroke uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Accountant</th>
                <th className="py-3 px-4">Assigned College</th>
                <th className="py-3 px-4">Plan / Price</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-s-stroke">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-t-secondary">
                    Loading accountants...
                  </td>
                </tr>
              ) : accountants.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-t-secondary">
                    No accountant users found.
                  </td>
                </tr>
              ) : (
                accountants.map((a) => (
                  <tr key={a.id} className="hover:bg-b-surface2/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-t-primary">{a.name}</div>
                      <div className="text-[11px] text-t-tertiary">{a.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      {a.college ? (
                        <div>
                          <div className="font-medium text-t-primary">{a.college.name}</div>
                          <div className="text-[11px] text-t-tertiary font-mono">{a.college.code}</div>
                        </div>
                      ) : (
                        <span className="text-t-tertiary italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {a.college ? (
                        <div>
                          <span className="capitalize font-semibold text-t-primary">{a.college.planId}</span>
                          <div className="text-[11px] text-t-tertiary font-medium">
                            {formatPKR(a.college.billingPrice)}/{a.college.billingCycle === 'YEARLY' ? 'yr' : 'mo'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-t-tertiary">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-t-secondary">
                      {a.phone || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        a.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {a.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-t-secondary text-[11px]">
                      {a.lastLogin
                        ? new Date(a.lastLogin).toLocaleDateString('en-PK', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Never'}
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
            {Math.min(pagination.total, pagination.page * pagination.limit)} of {pagination.total} accountants
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
    </div>
  );
}

export default function AccountantDetailsPage() {
  return (
    <AuthGuard allowedRoles={['superAdmin']}>
      <DashboardLayout>
        <AccountantsContent />
      </DashboardLayout>
    </AuthGuard>
  );
}

