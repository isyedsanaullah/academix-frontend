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

  // Status Badge Colors
  const getStatusBadge = (st) => {
    switch (st?.toLowerCase()) {
      case 'verified':
      case 'completed':
        return { label: 'Verified', bg: 'rgba(74,222,128,0.1)', color: '#4ade80', border: 'rgba(74,222,128,0.2)' };
      case 'pending':
        return { label: 'Pending', bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: 'rgba(251,191,36,0.2)' };
      case 'rejected':
      case 'failed':
        return { label: 'Issue', bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.2)' };
      default:
        return { label: st || 'Completed', bg: 'rgba(129,140,248,0.1)', color: '#818cf8', border: 'rgba(129,140,248,0.2)' };
    }
  };

  const badge = getStatusBadge(status);
  const hasMetadata = metadata && Object.keys(metadata).length > 0;

  return (
    <div
      style={{
        display: 'flex',
        gap: '14px',
        padding: isCompact ? '12px 14px' : '16px 18px',
        borderRadius: '14px',
        background: 'var(--hover-bg, rgba(255, 255, 255, 0.02))',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
        transition: 'all 0.15s ease',
        alignItems: 'flex-start',
      }}
      className="activity-item-card hover:bg-white/[0.04]"
    >
      <ActivityCategoryIcon category={category} size={isCompact ? 16 : 18} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <h4 style={{ fontSize: isCompact ? '13px' : '14px', fontWeight: 700, color: 'var(--text-primary, #f9fafb)', margin: 0, lineHeight: 1.3 }}>
            {title}
          </h4>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '6px',
              background: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.border}`,
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {badge.label}
          </span>
        </div>

        {description && (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary, rgba(255, 255, 255, 0.7))', marginTop: '4px', marginBottom: 0, lineHeight: 1.4 }}>
            {description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-tertiary, rgba(255, 255, 255, 0.4))' }}>
            <HiOutlineClock size={12} />
            <span>{timeString} · {dateString}</span>
          </div>

          {actorName && (
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary, rgba(255, 255, 255, 0.4))' }}>
              by <strong style={{ color: 'var(--text-secondary, rgba(255, 255, 255, 0.8))' }}>{actorName}</strong>
              {actorRole && <span style={{ opacity: 0.7 }}> ({actorRole})</span>}
            </span>
          )}

          {category && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--text-tertiary, rgba(255, 255, 255, 0.4))' }}>
              <HiOutlineTag size={10} />
              {category}
            </span>
          )}

          {!isCompact && hasMetadata && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#818cf8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 4px',
              }}
            >
              {expanded ? 'Less info' : 'Details'}
              {expanded ? <HiOutlineChevronUp size={12} /> : <HiOutlineChevronDown size={12} />}
            </button>
          )}
        </div>

        {expanded && hasMetadata && (
          <div
            style={{
              marginTop: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {Object.entries(metadata).map(([k, v]) => (
              <div key={k} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}: </span>
                <span style={{ fontWeight: 600 }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
