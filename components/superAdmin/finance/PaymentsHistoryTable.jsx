'use client';

import { useState, memo } from 'react';
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

function PaymentsHistoryTable({
  payments = [],
  loading = false,
  searchTerm = '',
  onSearchChange,
  planFilter = 'ALL',
  onPlanFilterChange,
  methodFilter = 'ALL',
  onMethodFilterChange,
  onRowClick,
  onApprove,
  onOpenRejectModal,
  onExportCsv,
  pagination = { page: 1, limit: 20, total: 0, totalPages: 1 },
  onPageChange,
}) {
  return (
    <div className="card p-0 overflow-hidden border border-s-subtle shadow-card space-y-0">
      {/* Search & Actions Bar */}
      <div className="p-4 border-b border-s-subtle flex flex-col md:flex-row gap-3 items-center justify-between bg-b-surface2/60">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search receipt, TID, college..."
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

          {/* Method filter */}
          <select
            value={methodFilter}
            onChange={(e) => onMethodFilterChange(e.target.value)}
            className="h-10 px-3.5 text-xs rounded-2xl bg-b-surface1 border border-s-subtle text-t-primary focus:border-[var(--accent,var(--primary-01))] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Methods</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="EASYPAISA">EasyPaisa</option>
            <option value="JAZZCASH">JazzCash</option>
          </select>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={onExportCsv}
            className="btn-secondary h-10 px-3.5 text-xs flex items-center gap-2 rounded-2xl cursor-pointer"
            title="Export payments ledger as CSV"
          >
            <Icon name="upload" className="!size-4 fill-current rotate-180" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-t-primary">
          <thead className="bg-b-depth2/60 text-t-secondary border-b border-s-subtle uppercase text-[10px] font-semibold tracking-wider">
            <tr>
              <th className="py-3.5 px-4.5">Receipt # / TID</th>
              <th className="py-3.5 px-4.5">Institution</th>
              <th className="py-3.5 px-4.5">Plan / Cycle</th>
              <th className="py-3.5 px-4.5">Amount</th>
              <th className="py-3.5 px-4.5">Method</th>
              <th className="py-3.5 px-4.5">Submitted</th>
              <th className="py-3.5 px-4.5">Status</th>
              <th className="py-3.5 px-4.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-s-subtle">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-14 text-center text-t-secondary">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="size-7 border-2 border-[var(--accent,var(--primary-01))] border-t-transparent rounded-full animate-spin" />
                    <span>Loading ledger transactions...</span>
                  </div>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-14 text-center text-t-secondary">
                  <div className="max-w-xs mx-auto space-y-1">
                    <p className="font-semibold text-t-primary">No payment records found</p>
                    <p className="text-caption text-t-tertiary">Try clearing your search query or filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              payments.map((p) => {
                const initials = getCollegeInitials(p.college?.name, p.college?.code);
                return (
                  <tr
                    key={p.id}
                    onClick={() => onRowClick(p)}
                    className="hover:bg-b-surface1/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4.5 font-mono">
                      <div className="font-bold text-t-primary group-hover:text-[var(--accent,var(--primary-01))] transition-colors">
                        {p.receiptNumber || '—'}
                      </div>
                      <div className="text-[11px] text-t-tertiary">{p.transactionId || '—'}</div>
                    </td>

                    <td className="py-3.5 px-4.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-2xl bg-b-depth2 border border-s-subtle flex items-center justify-center font-bold text-caption text-t-secondary shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-t-primary truncate max-w-[180px]">
                            {p.college?.name || '—'}
                          </div>
                          <div className="text-[11px] font-mono text-t-tertiary">
                            {p.college?.code || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4.5">
                      <PlanBadge planId={p.planId || 'starter'} size="sm" />
                      <div className="text-[11px] text-t-tertiary font-mono mt-0.5 uppercase">
                        {p.billingCycle || 'MONTHLY'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4.5 font-bold text-t-primary tabular-nums">
                      {formatPKR(p.verifiedAmount != null ? p.verifiedAmount : p.amountPaid)}
                    </td>

                    <td className="py-3.5 px-4.5 uppercase text-[11px] text-t-secondary font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-b-depth2 border border-s-subtle">
                        {p.paymentMethod || '—'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4.5 text-t-secondary text-caption tabular-nums">
                      {new Date(p.createdAt).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-caption font-bold ${
                          p.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20'
                            : p.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20'
                              : 'bg-red-500/10 text-red-600 dark:bg-red-500/20'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4.5 text-right">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onRowClick(p)}
                          className="btn-secondary h-8 px-3 text-caption rounded-xl font-medium"
                        >
                          View
                        </button>

                        {p.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onApprove(p.id)}
                              className="btn-primary h-8 px-3 text-caption bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenRejectModal(p)}
                              className="btn-secondary h-8 px-3 text-caption text-red-600 hover:bg-red-500/10 rounded-xl font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
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
          {Math.min(pagination.total, pagination.page * pagination.limit)} of {pagination.total} records
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

export default memo(PaymentsHistoryTable);

