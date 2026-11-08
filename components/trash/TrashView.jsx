'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchTrash, restoreTrashItem } from '../../services/trash.service';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Pagination from '../common/Pagination';
import Icon from '../Icon';

const RESOURCE_LABELS = {
  announcement: 'Announcement',
  assignment: 'Assignment',
  pDFDocument: 'Study Material',
  quiz: 'Quiz',
};

const RESOURCE_ICONS = {
  announcement: 'megaphone',
  assignment: 'clipboard-list',
  pDFDocument: 'document',
  quiz: 'question-circle',
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
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TrashView({ role }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [restoring, setRestoring] = useState({});

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

  useEffect(() => {
    load();
  }, [load]);

  const handleRestore = async (item) => {
    setRestoring((prev) => ({ ...prev, [item.id]: true }));
    try {
      await restoreTrashItem(item.resourceType, item.id);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || 'Restore failed. Please try again.');
    } finally {
      setRestoring((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Trash</h1>
          <p className="page-sub">
            Deleted items are kept for 7 days and can be restored during this period.
          </p>
        </div>
        <Button isStroke icon="refresh" onClick={load}>
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col gap-3" aria-busy="true">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton h-20 rounded-3xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-3xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-4 text-body-2 text-[var(--danger)]">
          {error}
        </div>
      )}

      {!loading && !error && data?.items?.length === 0 && (
        <Card>
          <EmptyState
            icon="trash"
            title="Trash is empty"
            description="Deleted items will appear here and can be restored within 7 days."
          />
        </Card>
      )}

      {!loading && !error && data?.items?.length > 0 && (
        <div className="flex flex-col gap-3">
          {data.items.map((item) => (
            <Card
              key={item.id}
              className={`flex flex-wrap sm:flex-nowrap items-center gap-4 ${
                item.isExpired ? 'opacity-50' : ''
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]">
                <Icon
                  name={RESOURCE_ICONS[item.resourceType] || 'archive'}
                  size={22}
                  className="fill-current"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="label label-blue">
                    {RESOURCE_LABELS[item.resourceType] || item.resourceType}
                  </span>
                  {item.isExpired && <span className="label label-red">Expired</span>}
                </div>
                <p className="truncate text-sub-title-1 text-t-primary">{item.title}</p>
                <div className="mt-1 flex flex-wrap gap-4 text-caption text-t-tertiary">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" size={13} className="fill-current" />
                    Deleted {formatDate(item.deletedAt)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      item.isExpired ? 'text-[var(--danger)]' : 'text-[var(--brand-green-text)]'
                    }`}
                  >
                    {formatTimeRemaining(item.remainingMs)}
                  </span>
                  {item.deleteReason && <span>Reason: {item.deleteReason}</span>}
                </div>
              </div>

              <Button
                isStroke={!item.isExpired}
                disabled={item.isExpired || restoring[item.id]}
                onClick={() => handleRestore(item)}
                icon="undo"
                size="sm"
              >
                {restoring[item.id] ? 'Restoring…' : item.isExpired ? 'Expired' : 'Restore'}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {!loading && data?.pagination && data.pagination.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pagination.totalPages}
          onPageChange={(p) => setPage(p)}
        />
      )}
    </div>
  );
}
