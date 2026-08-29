'use client';

import { useState } from 'react';
import ActivityCategoryIcon from './ActivityCategoryIcon';
import { HiOutlineClock, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineTag } from 'react-icons/hi';

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
        return { 
          label: 'Verified', 
          cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25' 
        };
      case 'pending':
        return { 
          label: 'Pending', 
          cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25' 
        };
      case 'rejected':
      case 'failed':
        return { 
          label: 'Issue', 
          cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25' 
        };
      default:
        return { 
          label: st || 'Completed', 
          cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/25' 
        };
    }
  };

  const badge = getStatusBadge(status);
  const hasMetadata = metadata && Object.keys(metadata).length > 0;

  return (
    <div
      className={`w-full flex items-start gap-3 sm:gap-4 ${
        isCompact ? 'p-3 sm:p-3.5' : 'p-4 sm:p-4.5'
      } rounded-xl bg-slate-50/80 hover:bg-slate-100 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.06] transition-all duration-200 shadow-xs dark:shadow-none`}
    >
      <ActivityCategoryIcon category={category} size={isCompact ? 16 : 18} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4 className={`font-semibold text-slate-900 dark:text-white leading-tight ${
            isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
          }`}>
            {title}
          </h4>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border capitalize ${badge.cls}`}
          >
            {badge.label}
          </span>
        </div>

        {description && (
          <p className="text-xs text-slate-600 dark:text-white/70 mt-1 leading-relaxed">
            {description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 flex-wrap text-[11px] text-slate-500 dark:text-white/40">
          <div className="flex items-center gap-1">
            <HiOutlineClock size={13} className="text-slate-400 dark:text-white/40" />
            <span>{timeString} · {dateString}</span>
          </div>

          {actorName && (
            <span>
              by <strong className="font-semibold text-slate-700 dark:text-white/80">{actorName}</strong>
              {actorRole && <span className="opacity-75"> ({actorRole})</span>}
            </span>
          )}

          {category && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-white/40">
              <HiOutlineTag size={11} />
              {category}
            </span>
          )}

          {!isCompact && hasMetadata && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-auto text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
            >
              {expanded ? 'Less info' : 'Details'}
              {expanded ? <HiOutlineChevronUp size={13} /> : <HiOutlineChevronDown size={13} />}
            </button>
          )}
        </div>

        {expanded && hasMetadata && (
          <div className="mt-3 p-3 rounded-lg bg-slate-100/80 dark:bg-black/30 border border-slate-200 dark:border-white/10 flex flex-wrap gap-2">
            {Object.entries(metadata).map(([k, v]) => (
              <div key={k} className="text-xs px-2 py-1 rounded bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.05] text-slate-700 dark:text-white/80">
                <span className="text-slate-500 dark:text-white/40 capitalize">{k.replace(/([A-Z])/g, ' $1')}: </span>
                <span className="font-semibold">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
