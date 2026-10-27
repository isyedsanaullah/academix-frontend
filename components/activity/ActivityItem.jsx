'use client';

import { useState } from 'react';
import ActivityCategoryIcon from './ActivityCategoryIcon';
import {
  HiOutlineClock,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineTag,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle
} from 'react-icons/hi';

export default function ActivityItem({ activity, isCompact = false }) {
  const [expanded, setExpanded] = useState(false);

  if (!activity) return null;

  const {
    title,
    description,
    category,
    actorName,
    actorRole,
    createdAt,
    status = 'completed',
    metadata
  } = activity;

  // Format date / time
  const dateObj = new Date(createdAt);
  const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  // Status badge (text + icon + tint, so never colour alone)
  const getStatusBadge = (st) => {
    switch (st?.toLowerCase()) {
      case 'verified':
      case 'completed':
      case 'success':
        return { label: 'Verified', icon: HiOutlineCheckCircle, cls: 'badge-success' };
      case 'pending':
        return { label: 'Pending', icon: HiOutlineClock, cls: 'badge-warning' };
      case 'rejected':
      case 'failed':
      case 'issue':
        return { label: 'Issue', icon: HiOutlineExclamationCircle, cls: 'badge-danger' };
      default:
        return { label: st || 'Logged', icon: HiOutlineInformationCircle, cls: 'badge-primary' };
    }
  };

  const badge = getStatusBadge(status);
  const StatusIcon = badge.icon;
  const hasMetadata = metadata && Object.keys(metadata).length > 0;

  // Compact rows live inside another card (dashboard widget) → light block, not a nested card.
  const shell = isCompact
    ? 'flex w-full items-start gap-2.5 rounded-xl bg-card-2 p-2.5'
    : 'card flex w-full items-start gap-3 hover:border-line-strong';

  return (
    <div className={shell}>
      <ActivityCategoryIcon category={category} size={isCompact ? 16 : 18} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <h4
            className={`min-w-0 break-words font-semibold leading-tight text-fg ${isCompact ? 'text-[13px]' : 'text-sm sm:text-[15px]'
              }`}
          >
            {title}
          </h4>

          <div className="flex shrink-0 items-center gap-1.5">
            {category && (
              <span className="badge badge-neutral hidden sm:inline-flex">
                <HiOutlineTag size={11} aria-hidden="true" />
                {category}
              </span>
            )}
            <span className={`badge capitalize ${badge.cls}`}>
              <StatusIcon size={12} aria-hidden="true" />
              {badge.label}
            </span>
          </div>
        </div>

        {description && (
          <p className="mt-1 break-words text-xs leading-relaxed text-fg-muted">
            {description}
          </p>
        )}

        {/* Footer info row */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fg-muted">
          <div className="flex items-center gap-1">
            <HiOutlineClock size={13} className="shrink-0 text-fg-faint" aria-hidden="true" />
            <span className="font-medium tabular-nums">{timeString} · {dateString}</span>
          </div>

          {actorName && (
            <div className="flex min-w-0 items-center gap-1">
              <HiOutlineUser size={13} className="shrink-0 text-fg-faint" aria-hidden="true" />
              <span className="min-w-0 break-words">
                by <strong className="font-semibold text-fg">{actorName}</strong>
                {actorRole && <span className="font-normal text-fg-faint"> ({actorRole})</span>}
              </span>
            </div>
          )}

          {category && (
            <span className="inline-flex items-center gap-1 text-[10px] text-fg-faint sm:hidden">
              <HiOutlineTag size={11} aria-hidden="true" />
              {category}
            </span>
          )}

          {!isCompact && hasMetadata && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              className="btn-ghost btn-sm ml-auto"
            >
              <span>{expanded ? 'Hide Details' : 'View Details'}</span>
              {expanded
                ? <HiOutlineChevronUp size={14} aria-hidden="true" />
                : <HiOutlineChevronDown size={14} aria-hidden="true" />}
            </button>
          )}
        </div>

        {/* Expanded metadata details */}
        {expanded && hasMetadata && (
          <div className="mt-2.5 flex flex-wrap gap-2 rounded-xl bg-card-2 p-2.5">
            {Object.entries(metadata).map(([k, v]) => (
              <div
                key={k}
                className="min-w-0 max-w-full break-words rounded-lg border border-line bg-card px-2.5 py-1 text-xs"
              >
                <span className="font-medium capitalize text-fg-muted">
                  {k.replace(/([A-Z])/g, ' $1')}:{' '}
                </span>
                <span className="break-all font-mono font-semibold text-accent">
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}