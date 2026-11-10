'use client';

import { memo } from 'react';
import Icon from '@/components/Icon';
import PlanBadge from '@/components/common/PlanBadge';
import { formatPKR } from '@/lib/money';

function AccountantsTable({
  accountants = [],
  loading = false,
  searchTerm = '',
  onSearchChange,
  statusFilter = 'ALL',
  onStatusFilterChange,
  onRowClick,
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
            placeholder="Search accountant by name or email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-10 pr-3 text-xs rounded-2xl bg-b-surface1 border border-s-subtle text-t-primary placeholder:text-t-tertiary focus:border-[var(--accent,var(--primary-01))] focus:outline-none transition-colors"
          />
          <Icon name="search" className="!size-4 fill-t-tertiary absolute left-3.5 top-3" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="h-10 px-3.5 text-xs rounded-2xl bg-b-surface1 border border-s-subtle text-t-primary focus:border-[var(--accent,var(--primary-01))] focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-t-primary">
          <thead className="bg-b-depth2/60 text-t-secondary border-b border-s-subtle uppercase text-[10px] font-semibold tracking-wider">
            <tr>
              <th className="py-3.5 px-4.5">Accountant</th>
              <th className="py-3.5 px-4.5">Assigned Institution</th>
              <th className="py-3.5 px-4.5">Plan / Derived Price</th>
              <th className="py-3.5 px-4.5">Phone Contact</th>
              <th className="py-3.5 px-4.5">Status</th>
              <th className="py-3.5 px-4.5">Last Login</th>
              <th className="py-3.5 px-4.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-s-subtle">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-14 text-center text-t-secondary">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="size-7 border-2 border-[var(--accent,var(--primary-01))] border-t-transparent rounded-full animate-spin" />
                    <span>Loading accountant profiles...</span>
                  </div>
                </td>
              </tr>
            ) : accountants.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-14 text-center text-t-secondary">
                  <div className="max-w-xs mx-auto space-y-1">
                    <p className="font-semibold text-t-primary">No accountant users found</p>
                    <p className="text-caption text-t-tertiary">Try clearing your search query or filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              accountants.map((a) => {
                const initials = a.name ? a.name.slice(0, 2).toUpperCase() : 'AC';
                return (
                  <tr
                    key={a.id}
                    onClick={() => onRowClick(a)}
                    className="hover:bg-b-surface1/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-2xl bg-b-depth2 border border-s-subtle flex items-center justify-center font-bold text-caption text-t-secondary shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-t-primary truncate max-w-[180px] group-hover:text-[var(--accent,var(--primary-01))] transition-colors">
                            {a.name}
                          </div>
                          <div className="text-[11px] font-mono text-t-tertiary">
                            {a.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4.5">
                      {a.college ? (
                        <div>
                          <div className="font-semibold text-t-primary">{a.college.name}</div>
                          <div className="text-[11px] font-mono text-t-tertiary">{a.college.code}</div>
                        </div>
                      ) : (
                        <span className="text-t-tertiary italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4.5">
                      {a.college ? (
                        <div>
                          <PlanBadge planId={a.college.planId || 'starter'} size="sm" />
                          <div className="text-[11px] font-bold text-t-primary mt-1 tabular-nums">
                            {formatPKR(a.college.billingPrice)}
                            <span className="text-[10px] text-t-tertiary font-normal">
                              /{a.college.billingCycle === 'YEARLY' ? 'yr' : 'mo'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-t-tertiary">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4.5 text-caption text-t-secondary font-mono">
                      {a.phone || '—'}
                    </td>

                    <td className="py-3.5 px-4.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-caption font-bold ${
                          a.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 dark:bg-red-500/20'
                        }`}
                      >
                        {a.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4.5 text-caption text-t-secondary tabular-nums">
                      {a.lastLogin
                        ? new Date(a.lastLogin).toLocaleDateString('en-PK', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Never'}
                    </td>

                    <td className="py-3.5 px-4.5 text-right">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onRowClick(a)}
                          className="btn-secondary h-8 px-3 text-caption rounded-xl font-medium"
                        >
                          View Profile
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
          {Math.min(pagination.total, pagination.page * pagination.limit)} of {pagination.total} accountants
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

export default memo(AccountantsTable);

