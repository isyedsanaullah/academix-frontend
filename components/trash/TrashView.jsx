'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchTrash, restoreTrashItem } from '../../services/trash.service';
import UndoToast from '../common/UndoToast';

const RESOURCE_LABELS = {
  announcement: 'Announcement',
  assignment:   'Assignment',
  pDFDocument:  'Study Material',
  quiz:         'Quiz',
};

const RESOURCE_ICONS = {
  announcement: '📢',
  assignment:   '📝',
  pDFDocument:  '📄',
  quiz:         '🧩',
};

function formatTimeRemaining(remainingMs) {
  if (remainingMs <= 0) return 'Expired';
  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const mins = Math.floor((remainingMs % (60 * 60 * 1000)) / 60000);
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * TrashView
 * Reusable Trash panel for all 7 user roles.
 * Renders paginated soft-deleted items with Restore action and expiry indicators.
 */
export default function TrashView({ role }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [restoring, setRestoring] = useState({});
  const [undoToast, setUndoToast] = useState(null); // For immediate restore undo after manual restore action (if applicable)

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTrash({ page, limit: 20 });
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load trash items.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async (item) => {
    setRestoring(prev => ({ ...prev, [item.id]: true }));
    try {
      await restoreTrashItem(item.resourceType, item.id);
      await load(); // Refresh list
    } catch (err) {
      alert(err?.response?.data?.message || 'Restore failed. Please try again.');
    } finally {
      setRestoring(prev => ({ ...prev, [item.id]: false }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            🗑️ Trash
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
            Deleted items are kept for 7 days and can be restored during this period.
          </p>
        </div>
        <button
          onClick={load}
          style={{
            padding: '7px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
            border: '1px solid var(--border-color)', background: 'var(--hover-bg)',
            color: 'var(--text-secondary)',
          }}
        >
          ↺ Refresh
        </button>
      </div>

      {/* State: Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)', fontSize: '14px' }}>
          Loading trash items…
        </div>
      )}

      {/* State: Error */}
      {!loading && error && (
        <div style={{
          borderRadius: '12px', padding: '16px', background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* State: Empty */}
      {!loading && !error && data?.items?.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '56px 24px' }}>
          <p style={{ fontSize: '36px', margin: '0 0 12px' }}>✅</p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Trash is empty
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>
            Deleted items will appear here and can be restored within 7 days.
          </p>
        </div>
      )}

      {/* Items List */}
      {!loading && !error && data?.items?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {data.items.map(item => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: '16px',
                opacity: item.isExpired ? 0.5 : 1,
              }}
            >
              {/* Resource icon */}
              <span style={{ fontSize: '24px', flexShrink: 0 }}>
                {RESOURCE_ICONS[item.resourceType] || '📦'}
              </span>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, color: '#818cf8',
                    background: 'rgba(129,140,248,0.1)', borderRadius: '4px', padding: '1px 8px',
                    border: '1px solid rgba(129,140,248,0.2)',
                  }}>
                    {RESOURCE_LABELS[item.resourceType] || item.resourceType}
                  </span>
                  {item.isExpired && (
                    <span style={{
                      fontSize: '11px', fontWeight: 600, color: '#f87171',
                      background: 'rgba(239,68,68,0.08)', borderRadius: '4px', padding: '1px 8px',
                      border: '1px solid rgba(239,68,68,0.2)',
                    }}>
                      Expired
                    </span>
                  )}
                </div>
                <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    🕒 Deleted {formatDate(item.deletedAt)}
                  </span>
                  <span style={{ fontSize: '11px', color: item.isExpired ? '#f87171' : 'rgba(74,222,128,0.8)' }}>
                    ⏳ {formatTimeRemaining(item.remainingMs)}
                  </span>
                  {item.deleteReason && (
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      💬 {item.deleteReason}
                    </span>
                  )}
                </div>
              </div>

              {/* Restore button */}
              <button
                onClick={() => handleRestore(item)}
                disabled={item.isExpired || restoring[item.id]}
                style={{
                  padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  border: item.isExpired ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(74,222,128,0.3)',
                  background: item.isExpired ? 'rgba(255,255,255,0.03)' : 'rgba(74,222,128,0.08)',
                  color: item.isExpired ? 'var(--text-tertiary)' : '#4ade80',
                  cursor: item.isExpired ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.12s',
                  whiteSpace: 'nowrap',
                }}
              >
                {restoring[item.id] ? 'Restoring…' : item.isExpired ? 'Expired' : '↩ Restore'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && data?.pagination && data.pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: page <= 1 ? 'not-allowed' : 'pointer',
              border: '1px solid var(--border-color)', background: 'var(--hover-bg)', color: 'var(--text-secondary)',
              opacity: page <= 1 ? 0.4 : 1,
            }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Page {page} of {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page >= data.pagination.totalPages}
            style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: page >= data.pagination.totalPages ? 'not-allowed' : 'pointer',
              border: '1px solid var(--border-color)', background: 'var(--hover-bg)', color: 'var(--text-secondary)',
              opacity: page >= data.pagination.totalPages ? 0.4 : 1,
            }}
          >
            Next →
          </button>
        </div>
      )}

    </div>
  );
}
