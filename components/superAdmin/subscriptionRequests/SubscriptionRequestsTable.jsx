'use client';

import { useState, useMemo, Fragment, memo } from 'react';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import {
  HiOutlineSearch,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
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

function SubscriptionRequestsTable({
  requests = [],
  loading = false,
  searchTerm = '',
  onSearchChange,
  onRowClick,
  onMarkContacted,
  onOpenApprove,
  onOpenReject,
  onReopen,
  onResendInvite,
  actionLoading = false,
  pagination = { total: 0, pages: 1 },
  currentPage = 1,
  onPageChange,
}) {
  // State for expanded duplicate email groups
  const [expandedEmails, setExpandedEmails] = useState(new Set());

  const toggleExpandEmail = (email, e) => {
    e.stopPropagation();
    setExpandedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  // Group requests by adminEmail to detect duplicate submissions
  const groupedData = useMemo(() => {
    const emailGroups = new Map();

    requests.forEach((r) => {
      const email = (r.adminEmail || '').toLowerCase().trim();
      if (!emailGroups.has(email)) {
        emailGroups.set(email, []);
      }
      emailGroups.get(email).push(r);
    });

    const groups = [];
    emailGroups.forEach((items, email) => {
      // Sort submissions by date descending
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      groups.push({
        email,
        primary: items[0],
        allSubmissions: items,
        hasDuplicates: items.length > 1,
      });
    });

    return groups;
  }, [requests]);

  const renderContactInfo = (req) => {
    const method = (req.preferredContactMethod || req.preferred_contact_method || '').toLowerCase();
    const prefersPhone = method === 'phone' || (!req.adminEmail && req.phone);

    if (prefersPhone && req.phone) {
      return (
        <span
          className="inline-flex items-center gap-1.5 text-caption font-mono text-t-primary"
          title={`Preferred: Phone (${req.phone})`}
        >
          <HiOutlinePhone className="size-3.5 text-primary-01 shrink-0" />
          <span>{req.phone}</span>
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1.5 text-caption text-t-primary truncate max-w-xs"
        title={`Preferred: Email (${req.adminEmail})`}
      >
        <HiOutlineMail className="size-3.5 text-primary-01 shrink-0" />
        <span className="truncate">{req.adminEmail || '—'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* ── Core 2.0 Styled Search Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-t-tertiary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by college name, email, or contact number…"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-b-surface2 border border-s-subtle text-caption text-t-primary placeholder:text-t-tertiary shadow-depth outline-none transition focus:border-primary-01"
          />
        </div>

        <div className="text-caption text-t-secondary self-center px-1 font-mono">
          Showing <strong className="text-t-primary">{requests.length}</strong> of{' '}
          <strong className="text-t-primary">{pagination.total ?? requests.length}</strong> requests
        </div>
      </div>

      {/* ── Main Data Table ── */}
      <div className="card p-0 overflow-hidden border border-s-subtle shadow-widget">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-s-subtle bg-b-surface2/60 text-caption font-semibold text-t-secondary uppercase tracking-wider">
                <th className="py-3.5 px-5">College / Institution</th>
                <th className="py-3.5 px-4">Preferred Contact</th>
                <th className="py-3.5 px-4">Plan Requested</th>
                <th className="py-3.5 px-4 text-center">Students</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-s-subtle">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <CollegesHubLoader
                      size="md"
                      text="Loading subscription requests…"
                      minHeight="min-h-[160px]"
                    />
                  </td>
                </tr>
              ) : groupedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-t-secondary">
                      <div className="size-12 rounded-2xl bg-b-depth2 flex items-center justify-center text-t-tertiary mb-1">
                        <HiOutlineDocumentText size={24} />
                      </div>
                      <p className="font-semibold text-sub-title-2 text-t-primary">
                        No subscription requests found
                      </p>
                      <p className="text-caption max-w-sm">
                        Try selecting another status card or adjusting your search query.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                groupedData.map((group, groupIdx) => {
                  const r = group.primary;
                  const isExpanded = expandedEmails.has(group.email);

                  return (
                    <Fragment key={group.email || r.id || `group-${groupIdx}`}>
                      {/* Primary Row (Clickable to open Detail Drawer) */}
                      <tr
                        onClick={() => onRowClick(r)}
                        className="hover:bg-b-depth2/50 transition-colors cursor-pointer group/row"
                      >
                        {/* College Name & Duplicates Badge */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sub-title-2 text-t-primary group-hover/row:text-primary-01 transition-colors">
                              {r.collegeName}
                            </span>
                            {group.hasDuplicates && (
                              <button
                                type="button"
                                onClick={(e) => toggleExpandEmail(group.email, e)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition cursor-pointer"
                                title="Multiple requests from this email. Click to expand."
                              >
                                <span>{group.allSubmissions.length} Requests</span>
                                {isExpanded ? (
                                  <HiOutlineChevronUp size={11} />
                                ) : (
                                  <HiOutlineChevronDown size={11} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Preferred Contact (Email or Phone only) */}
                        <td className="py-3.5 px-4">{renderContactInfo(r)}</td>

                        {/* Plan Requested */}
                        <td className="py-3.5 px-4 text-caption font-semibold text-t-primary">
                          <span className="capitalize">
                            {PLAN_LABELS[r.selectedPlan?.toLowerCase()] || r.selectedPlan}
                          </span>
                        </td>

                        {/* Student Count */}
                        <td className="py-3.5 px-4 text-center font-mono text-caption text-t-primary tabular-nums">
                          {r.studentCount ? r.studentCount.toLocaleString() : '—'}
                        </td>

                        {/* Submitted Date */}
                        <td className="py-3.5 px-4 text-caption text-t-secondary whitespace-nowrap font-mono">
                          {new Date(r.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Action Buttons (Details button removed) */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div
                            className="inline-flex items-center justify-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {r.status === 'new' && (
                              <button
                                type="button"
                                onClick={() => onMarkContacted(r)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 text-caption font-bold rounded-xl bg-primary-01 hover:bg-primary-01/90 text-white shadow-depth transition cursor-pointer disabled:opacity-50"
                              >
                                Mark Contacted
                              </button>
                            )}

                            {r.status === 'contacted' && (
                              <button
                                type="button"
                                onClick={() => onOpenApprove(r)}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-caption font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-depth transition cursor-pointer disabled:opacity-50"
                              >
                                <HiOutlineSparkles size={14} />
                                <span>Approve</span>
                              </button>
                            )}

                            {r.status === 'approved' && (
                              <div className="inline-flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#00a656] font-bold px-2 py-1 rounded-lg bg-[#00a656]/10 border border-[#00a656]/20">
                                  <HiOutlineCheckCircle size={14} />
                                  <span>Provisioned</span>
                                </span>
                                {r.collegeId && (
                                  <button
                                    type="button"
                                    onClick={() => onResendInvite(r.collegeId)}
                                    title="Resend 7-day onboarding email"
                                    className="p-1.5 rounded-lg bg-b-depth2 border border-s-stroke2 hover:bg-b-depth1 text-t-secondary hover:text-t-primary transition"
                                  >
                                    <HiOutlineRefresh size={13} />
                                  </button>
                                )}
                              </div>
                            )}

                            {r.status !== 'rejected' && r.status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => onOpenReject(r)}
                                disabled={actionLoading}
                                className="px-2.5 py-1.5 text-caption font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition cursor-pointer disabled:opacity-50"
                              >
                                Reject
                              </button>
                            )}

                            {r.status === 'rejected' && (
                              <button
                                type="button"
                                onClick={() => onReopen(r)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 text-caption font-semibold rounded-xl bg-b-depth2 hover:bg-b-depth1 text-t-primary border border-s-stroke2 transition cursor-pointer disabled:opacity-50"
                              >
                                Re-open
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Duplicate Submissions Sub-Rows */}
                      {group.hasDuplicates &&
                        isExpanded &&
                        group.allSubmissions.slice(1).map((subReq) => (
                          <tr
                            key={subReq.id}
                            onClick={() => onRowClick(subReq)}
                            className="bg-b-depth2/30 hover:bg-b-depth2/60 transition-colors cursor-pointer border-t border-dashed border-s-subtle"
                          >
                            <td className="py-2.5 px-5 pl-10 text-caption text-t-secondary">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="text-t-tertiary">↳</span>
                                <span>Submission #{subReq.id.slice(0, 6)}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-4">{renderContactInfo(subReq)}</td>
                            <td className="py-2.5 px-4 text-caption text-t-secondary capitalize">
                              {PLAN_LABELS[subReq.selectedPlan?.toLowerCase()] || subReq.selectedPlan}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono text-caption text-t-secondary tabular-nums">
                              {subReq.studentCount || '—'}
                            </td>
                            <td className="py-2.5 px-4 text-caption text-t-tertiary whitespace-nowrap font-mono">
                              {new Date(subReq.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-2.5 px-5 text-right">
                              <span className="text-[10px] text-t-tertiary font-medium">
                                Click row for details
                              </span>
                            </td>
                          </tr>
                        ))}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-s-subtle bg-b-surface2/40 text-caption text-t-secondary">
            <span>
              Page {currentPage} of {pagination.pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="px-3 py-1.5 rounded-xl bg-b-depth2 border border-s-subtle text-caption font-semibold disabled:opacity-40 hover:bg-b-depth1 transition"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= pagination.pages}
                onClick={() => onPageChange(currentPage + 1)}
                className="px-3 py-1.5 rounded-xl bg-b-depth2 border border-s-subtle text-caption font-semibold disabled:opacity-40 hover:bg-b-depth1 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(SubscriptionRequestsTable);

