'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import PlanBadge from '@/components/common/PlanBadge';
import {
  HiOutlineClipboardCopy,
  HiOutlineCheck,
} from 'react-icons/hi';

const getCollegeInitials = (name, code) => {
  if (code && code.length >= 2) return code.slice(0, 2).toUpperCase();
  if (!name) return 'CH';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function CollegesTable({
  filteredColleges = [],
  navigate,
  onResetFilters,
  hasActiveFilters = false,
}) {
  const [copiedPhoneId, setCopiedPhoneId] = useState(null);

  const handleCopyPhone = (e, phone, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  if (filteredColleges.length === 0) {
    return (
      <div className="py-16 px-4 text-center">
        <div className="mx-auto mb-3 flex items-center justify-center size-12 rounded-2xl bg-b-surface1 text-t-tertiary">
          <Icon name="building" className="!size-6 fill-t-tertiary" />
        </div>
        <p className="text-sub-title-1 font-bold text-t-primary">
          No colleges match your filter
        </p>
        <p className="mt-1 text-body-2 text-t-secondary max-w-sm mx-auto">
          Try clearing your search term, resetting the plan filter, or clicking another stat card.
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="btn-secondary text-caption mt-4 inline-flex items-center gap-2 cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse table-auto">
        <thead>
          <tr className="border-b border-s-subtle text-caption font-semibold text-t-tertiary uppercase tracking-wider bg-b-depth2/50">
            <th className="py-3.5 pl-6 pr-4 min-w-[220px] w-1/4 text-left">College</th>
            <th className="py-3.5 px-4 min-w-[220px] w-1/4 text-left">City</th>
            <th className="py-3.5 px-3 w-24 shrink-0 text-left whitespace-nowrap">Code</th>
            <th className="py-3.5 px-3 w-44 shrink-0 text-left whitespace-nowrap">Phone</th>
            <th className="py-3.5 px-3 w-36 shrink-0 text-left whitespace-nowrap">Subscription Plan</th>
            <th className="py-3.5 pl-3 pr-6 w-36 shrink-0 text-right whitespace-nowrap">Expiry Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-s-subtle text-body-2">
          {filteredColleges.map((c) => {
            const collegeId = c._id || c.id;
            const status = (
              c.subscription?.status ||
              c.subscription_status ||
              c.status ||
              'active'
            ).toLowerCase();
            const isActive =
              c.isActive !== false &&
              status !== 'suspended' &&
              status !== 'expired' &&
              status !== 'grace';
            const initials = getCollegeInitials(c.name, c.code);
            const phone =
              c.phone || c.contactPhone || c.adminPhone || c.mobile || '';

            return (
              <tr
                key={collegeId}
                onClick={() =>
                  navigate(`/super-admin/colleges/${collegeId}`)
                }
                className="group cursor-pointer hover:bg-b-highlight transition-colors"
              >
                {/* 1. College (Name & Email) */}
                <td className="py-4 pl-6 pr-4 min-w-[220px] w-1/4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`size-11 rounded-2xl flex items-center justify-center font-bold text-xs uppercase shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? 'bg-[#00a656]/12 text-[#00a656] border border-[#00a656]/30 dark:bg-[#00a656]/20 dark:text-[#34d399] dark:border-[#00a656]/35'
                          : 'bg-[#ff381c]/12 text-[#ff381c] border border-[#ff381c]/30 dark:bg-[#ff381c]/20 dark:text-[#f87171] dark:border-[#ff381c]/35'
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-t-primary text-sub-title-2 truncate group-hover:text-[var(--accent,var(--primary-01))] transition-colors">
                        {c.name}
                      </p>
                      <p className="text-caption text-t-tertiary truncate">
                        {c.email || c.contactEmail || 'No official email'}
                      </p>
                    </div>
                  </div>
                </td>

                {/* 2. City */}
                <td className="py-4 px-4 min-w-[220px] w-1/4">
                  <span className="font-medium text-caption text-t-secondary truncate block">
                    {c.city || '—'}
                  </span>
                </td>

                {/* 3. Code */}
                <td className="py-4 px-3 w-24 shrink-0 whitespace-nowrap">
                  <span className="font-mono text-[11px] font-semibold text-t-secondary bg-b-surface1 border border-s-subtle px-2.5 py-1 rounded-lg">
                    {c.code}
                  </span>
                </td>

                {/* 4. Phone with copy icon on hover */}
                <td className="py-4 px-3 w-44 shrink-0 whitespace-nowrap">
                  {phone ? (
                    <div className="group/phone inline-flex items-center gap-1.5 text-caption font-mono text-t-secondary">
                      <span>{phone}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyPhone(e, phone, collegeId)}
                        title="Copy phone number"
                        aria-label="Copy phone number"
                        className="opacity-0 group-hover/phone:opacity-100 p-1 rounded-md text-t-secondary hover:text-primary-01 hover:bg-b-surface1 transition-all cursor-pointer"
                      >
                        {copiedPhoneId === collegeId ? (
                          <HiOutlineCheck className="size-3.5 text-[#00a656]" />
                        ) : (
                          <HiOutlineClipboardCopy className="size-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-t-tertiary text-caption font-mono">—</span>
                  )}
                </td>

                {/* 5. Subscription Plan */}
                <td className="py-4 px-3 w-36 shrink-0 whitespace-nowrap">
                  <PlanBadge
                    plan={c.subscription?.plan || c.planId || 'starter'}
                    className="!text-caption"
                  />
                </td>

                {/* 6. Expiry Date */}
                <td className="py-4 pl-3 pr-6 w-36 shrink-0 text-right whitespace-nowrap font-mono text-caption">
                  {c.subscription?.expiresAt ? (
                    <div>
                      <p className="font-semibold text-t-primary">
                        {new Date(c.subscription.expiresAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </p>
                      {c.daysLeft !== null && c.daysLeft !== undefined && (
                        <p
                          className={`text-[11px] ${
                            c.daysLeft < 0
                              ? 'text-rose-600 font-bold'
                              : c.daysLeft <= 30
                              ? 'text-amber-600 font-medium'
                              : 'text-t-tertiary'
                          }`}
                        >
                          {c.daysLeft < 0
                            ? `Expired ${Math.abs(c.daysLeft)}d ago`
                            : `${c.daysLeft} days left`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-t-tertiary font-sans">
                      Perpetual
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

