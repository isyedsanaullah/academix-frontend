'use client';

import { useState, memo } from 'react';
import ActivityCategoryIcon from './ActivityCategoryIcon';
import Icon from '@/components/Icon';

function ActivityItem({ activity, isCompact = false }) {
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
    metadata,
  } = activity;

  const dateObj = new Date(createdAt);
  const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const getStatusBadge = (st) => {
    switch (st?.toLowerCase()) {
      case 'verified':
      case 'completed':
      case 'success':
        return { label: 'Verified', icon: 'check-circle', cls: 'label-green' };
      case 'pending':
        return { label: 'Pending', icon: 'clock', cls: 'label-yellow' };
      case 'rejected':
      case 'failed':
      case 'issue':
        return { label: 'Issue', icon: 'alert', cls: 'label-red' };
      default:
        return { label: st || 'Logged', icon: 'info-circle', cls: 'label-blue' };
    }
  };

  const badge = getStatusBadge(status);
  const hasMetadata = metadata && Object.keys(metadata).length > 0;

  const shell = isCompact
    ? 'flex w-full items-start gap-3 rounded-2xl bg-b-surface1 border border-s-subtle p-3.5 transition-colors hover:border-s-stroke2'
    : 'card flex w-full items-start gap-4 transition-colors hover:border-s-highlight';

  return (
    <div className={shell}>
      <ActivityCategoryIcon category={category} size={isCompact ? 16 : 18} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <h4
            className={`min-w-0 break-words font-semibold leading-tight text-t-primary ${
              isCompact ? 'text-sub-title-2' : 'text-sub-title-1'
            }`}
          >
            {title}
          </h4>

          <div className="flex shrink-0 items-center gap-1.5">
            {category && (
              <span className="label label-gray hidden sm:inline-flex">
                <Icon name="tag" size={12} className="fill-current" aria-hidden="true" />
                {category}
              </span>
            )}
            <span className={`label capitalize ${badge.cls}`}>
              <Icon name={badge.icon} size={12} className="fill-current" aria-hidden="true" />
              {badge.label}
            </span>
          </div>
        </div>

        {description && (
          <p className="mt-1 break-words text-caption leading-relaxed text-t-secondary">
            {description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-t-tertiary">
          <div className="flex items-center gap-1">
            <Icon name="clock" size={13} className="shrink-0 fill-t-tertiary" aria-hidden="true" />
            <span className="font-medium tabular-nums">
              {timeString} · {dateString}
            </span>
          </div>

          {actorName && (
            <div className="flex min-w-0 items-center gap-1">
              <Icon name="profile" size={13} className="shrink-0 fill-t-tertiary" aria-hidden="true" />
              <span className="min-w-0 break-words">
                by <strong className="font-semibold text-t-primary">{actorName}</strong>
                {actorRole && <span className="font-normal text-t-tertiary"> ({actorRole})</span>}
              </span>
            </div>
          )}

          {!isCompact && hasMetadata && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              className="ml-auto inline-flex items-center gap-1 text-caption font-semibold text-[var(--brand-blue)] hover:underline"
            >
              <span>{expanded ? 'Hide Details' : 'View Details'}</span>
              <Icon
                name="chevron"
                size={14}
                className={`fill-current transition-transform ${expanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        {expanded && hasMetadata && (
          <div className="mt-2.5 flex flex-wrap gap-2 rounded-2xl bg-b-surface1 border border-s-subtle p-3">
            {Object.entries(metadata).map(([k, v]) => (
              <div
                key={k}
                className="min-w-0 max-w-full break-words rounded-xl border border-s-stroke2 bg-b-surface2 px-2.5 py-1 text-caption"
              >
                <span className="font-medium capitalize text-t-secondary">
                  {k.replace(/([A-Z])/g, ' $1')}:{' '}
                </span>
                <span className="break-all font-mono font-semibold text-[var(--brand-blue)]">
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

export default memo(ActivityItem);
