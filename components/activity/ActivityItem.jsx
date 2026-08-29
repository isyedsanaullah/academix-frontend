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

  // Status Badge Styling (Light + Dark compatible)
  const getStatusBadge = (st) => {
    switch (st?.toLowerCase()) {
      case 'verified':
      case 'completed':
      case 'success':
        return {
          label: 'Verified',
          icon: HiOutlineCheckCircle,
          cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
        };
      case 'pending':
        return {
          label: 'Pending',
          icon: HiOutlineClock,
          cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
        };
      case 'rejected':
      case 'failed':
      case 'issue':
        return {
          label: 'Issue',
          icon: HiOutlineExclamationCircle,
          cls: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
        };
      default:
        return {
          label: st || 'Logged',
          icon: HiOutlineInformationCircle,
          cls: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20'
        };
    }
  };

  const badge = getStatusBadge(status);
  const StatusIcon = badge.icon;
  const hasMetadata = metadata && Object.keys(metadata).length > 0;

  return (
    <div
      className={`w-full flex items-start gap-3 sm:gap-4 ${
        isCompact ? 'p-3 sm:p-3.5' : 'p-4 sm:p-4.5'
      } rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all duration-200 shadow-xs hover:shadow-md`}
    >
      <ActivityCategoryIcon category={category} size={isCompact ? 16 : 18} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4
            className={`font-bold text-slate-900 dark:text-white leading-tight ${
              isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
            }`}
          >
            {title}
          </h4>

          <div className="flex items-center gap-1.5 shrink-0">
            {category && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-white/60 border-slate-200 dark:border-white/[0.08]">
                <HiOutlineTag size={11} />
                {category}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${badge.cls}`}
            >
              <StatusIcon size={12} />
              {badge.label}
            </span>
          </div>
        </div>

        {description && (
          <p className="text-xs text-slate-600 dark:text-white/70 mt-1 leading-relaxed">
            {description}
          </p>
        )}

        {/* Footer Info Row */}
        <div className="flex items-center gap-3 mt-2.5 flex-wrap text-[11px] text-slate-500 dark:text-white/40">
          <div className="flex items-center gap-1">
            <HiOutlineClock size={13} className="text-slate-400 dark:text-white/40 shrink-0" />
            <span className="font-medium">{timeString} · {dateString}</span>
          </div>

          {actorName && (
            <div className="flex items-center gap-1">
              <HiOutlineUser size={13} className="text-slate-400 dark:text-white/40 shrink-0" />
              <span>
                by <strong className="font-bold text-slate-800 dark:text-white/90">{actorName}</strong>
                {actorRole && <span className="opacity-75 font-normal"> ({actorRole})</span>}
              </span>
            </div>
          )}

          {category && (
            <span className="inline-flex sm:hidden items-center gap-1 text-[10px] text-slate-500 dark:text-white/40">
              <HiOutlineTag size={11} />
              {category}
            </span>
          )}

          {!isCompact && hasMetadata && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-auto text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 transition-colors text-[10px] cursor-pointer"
            >
              <span>{expanded ? 'Hide Details' : 'View Details'}</span>
              {expanded ? <HiOutlineChevronUp size={13} /> : <HiOutlineChevronDown size={13} />}
            </button>
          )}
        </div>

        {/* Expanded Metadata Details */}
        {expanded && hasMetadata && (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] flex flex-wrap gap-2">
            {Object.entries(metadata).map(([k, v]) => (
              <div
                key={k}
                className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-[#131920] border border-slate-200 dark:border-white/[0.06] text-slate-800 dark:text-white/90 shadow-xs"
              >
                <span className="text-slate-500 dark:text-white/40 font-medium capitalize">
                  {k.replace(/([A-Z])/g, ' $1')}:{' '}
                </span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
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
