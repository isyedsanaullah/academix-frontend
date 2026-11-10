'use client';

import { memo } from 'react';
import Icon from '@/components/Icon';
import PlanBadge from '@/components/common/PlanBadge';
import { formatPKR } from '@/lib/money';

const getCollegeInitials = (name, code) => {
  if (code && code.length >= 2) return code.slice(0, 2).toUpperCase();
  if (!name) return 'CH';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

function CollegeBillingTable({
  colleges = [],
  loading = false,
  searchTerm = '',
  onSearchChange,
  planFilter = 'ALL',
  onPlanFilterChange,
  statusFilter = 'ALL',
  onStatusFilterChange,
  onRowClick,
  onOpenMigrate,
  pagination = { page: 1, limit: 20, total: 0, totalPages: 1 },
  onPageChange,
}) {
  return (
    <div className="card p-0 overflow-hidden border border-s-subtle shadow-card space-y-0">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-s-subtle flex flex-col md:flex-row gap-3 items-center justify-between bg-b-surface2/60">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search college name or code..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-10 pr-3 text-xs rounded-2xl bg-b-surface1 border border-s-subtle text-t-primary placeholder:text-t-tertiary focus:border-[var(--accent,var(--primary-01))] focus:outline-none transition-colors"
          />
          <Icon name="search" className="!size-4 fill-t-tertiary absolute left-3.5 top-3" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Plan filter */}
          <select
            value={planFilter}
            onChange={(e) => onPlanFilterChange(e.target.value)}
            className="h-10 px-3.5 text-xs rounded-2xl bg-b-surface1 border border-s-subtle text-t-primary focus:border-[var(--accent,var(--primary-01))] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Plans</option>
            <option value="starter">Starter</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-10 px-3.5 text-xs rounded-2xl bg-b-surface1 border border-s-subtle text-t-primary focus:border-[var(--accent,var(--primary-01))] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIAL">Trial</option>
            <option value="EXPIRED">Expired</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-t-primary">
          <thead className="bg-b-depth2/60 text-t-secondary border-b border-s-subtle uppercase text-[10px] font-semibold tracking-wider">
            <tr>
              <th className="py-3.5 px-4.5">Institution</th>
              <th className="py-3.5 px-4.5">Plan Tier</th>
              <th className="py-3.5 px-4.5">Cycle</th>
              <th className="py-3.5 px-4.5">Derived Price</th>
              <th className="py-3.5 px-4.5">Status</th>
              <th className="py-3.5 px-4.5">Settled Revenue</th>
              <th className="py-3.5 px-4.5">Latest Payment</th>
              <th className="py-3.5 px-4.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-s-subtle">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-14 text-center text-t-secondary">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="size-7 border-2 border-[var(--accent,var(--primary-01))] border-t-transparent rounded-full animate-spin" />
                    <span>Loading institutional setups...</span>
                  </div>
                </td>
              </tr>
            ) : colleges.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-14 text-center text-t-secondary">
                  <div className="max-w-xs mx-auto space-y-1">
                    <p className="font-semibold text-t-primary">No institutions match your search</p>
                    <p className="text-caption text-t-tertiary">Try clearing your filters or search term.</p>
                  </div>
                </td>
              </tr>
            ) : (
              colleges.map((c) => {
                const initials = getCollegeInitials(c.name, c.code);
                return (
                  <tr
                    key={c.id}
                    onClick={() => onRowClick(c)}
                    className="hover:bg-b-surface1/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-2xl bg-b-depth2 border border-s-subtle flex items-center justify-center font-bold text-caption text-t-secondary shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-t-primary truncate max-w-[200px] group-hover:text-[var(--accent,var(--primary-01))] transition-colors">
                            {c.name}
                          </div>
                          <div className="text-[11px] font-mono text-t-tertiary">
                            {c.code}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4.5">
                      <PlanBadge planId={c.planId || 'starter'} size="sm" />
                      {c.pendingDowngradePlanId && (
                        <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                          Downgrade to {c.pendingDowngradePlanId} queued
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4.5 font-mono text-caption text-t-secondary uppercase">
                      {c.billingCycle || 'MONTHLY'}
                    </td>

                    <td className="py-3.5 px-4.5 font-bold text-t-primary tabular-nums">
                      {formatPKR(c.billingPrice)}
                      <span className="text-[10px] text-t-tertiary font-normal ml-0.5">
                        /{c.billingCycle === 'YEARLY' ? 'yr' : 'mo'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-caption font-bold ${
                          c.subStatus === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20'
                            : c.subStatus === 'TRIAL'
                              ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20'
                              : c.subStatus === 'EXPIRED'
                                ? 'bg-red-500/10 text-red-600 dark:bg-red-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20'
                        }`}
                      >
                        {c.subStatus || 'ACTIVE'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4.5 font-semibold text-emerald-600 tabular-nums">
                      {formatPKR(c.totalSettledRevenue)}
                    </td>

                    <td className="py-3.5 px-4.5 text-caption text-t-secondary tabular-nums">
                      {c.latestPaymentDate
                        ? new Date(c.latestPaymentDate).toLocaleDateString('en-PK', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>

                    <td className="py-3.5 px-4.5 text-right">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onRowClick(c)}
                          className="btn-secondary h-8 px-3 text-caption rounded-xl font-medium"
                        >
                          Ledger &amp; Setup
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenMigrate(c)}
                          className="btn-primary h-8 px-3 text-caption rounded-xl font-semibold"
                        >
                          Change Plan
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 bg-b-surface2/60 border-t border-s-subtle flex items-center justify-between text-caption text-t-secondary">
        <span>
          Showing {Math.min(pagination.total, (pagination.page - 1) * pagination.limit + 1)} to{' '}
          {Math.min(pagination.total, pagination.page * pagination.limit)} of {pagination.total} institutions
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="btn-secondary h-8 px-3 text-caption rounded-xl disabled:opacity-40 cursor-pointer"
          >
            Previous
          </button>
          <span className="px-2 font-semibold text-t-primary">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="btn-secondary h-8 px-3 text-caption rounded-xl disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(CollegeBillingTable);

