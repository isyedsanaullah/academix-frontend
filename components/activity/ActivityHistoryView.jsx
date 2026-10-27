'use client';

import { useState, useEffect } from 'react';
import { fetchActivityLogs } from '../../services/activity.service';
import ActivityItem from './ActivityItem';
import {
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineDownload,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineRefresh,
  HiOutlineClock,
  HiOutlineX,
  HiOutlineFilter,
  HiOutlineDocumentText,
  HiOutlineAdjustments,
} from 'react-icons/hi';

const CATEGORIES = [
  'All',
  'Authentication',
  'Academic',
  'Assignment',
  'Examination',
  'Attendance',
  'Finance',
  'Student',
  'Teacher',
  'Administration',
  'Announcement',
  'Profile',
  'College',
  'System',
];

const DATE_RANGES = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
];

const STATUSES = ['All', 'completed', 'verified', 'pending', 'failed', 'rejected'];

export default function ActivityHistoryView({ role = 'student', roleTitle = 'Activity History' }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [dateRange, setDateRange] = useState('all');
  const [page, setPage] = useState(1);

  const hasActiveFilters = category !== 'All' || status !== 'All' || dateRange !== 'all' || search.trim() !== '';

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetchActivityLogs({
        page,
        limit: 20,
        category,
        status,
        dateRange,
        search,
      });
      setLogs(res?.data || []);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch activity history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [page, category, status, dateRange]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadHistory();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setStatus('All');
    setDateRange('all');
    setPage(1);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!logs || logs.length === 0) return;

    const headers = ['ID', 'Date', 'Time', 'Category', 'Action', 'Title', 'Description', 'Actor', 'Role', 'Status'];
    const rows = logs.map((l) => [
      l.id,
      new Date(l.createdAt).toLocaleDateString(),
      new Date(l.createdAt).toLocaleTimeString(),
      l.category,
      l.action,
      `"${(l.title || '').replace(/"/g, '""')}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      `"${(l.actorName || '').replace(/"/g, '""')}"`,
      l.actorRole,
      l.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${role}_activity_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group logs by Date headers (Today, Yesterday, date string)
  const groupLogsByDate = (items) => {
    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    items.forEach((item) => {
      const itemDate = new Date(item.createdAt).toDateString();
      let label = itemDate;
      if (itemDate === today) label = 'Today';
      else if (itemDate === yesterday) label = 'Yesterday';

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    return groups;
  };

  const grouped = groupLogsByDate(logs);

  return (
    <div className="page">

      {/* ─── Page header ─── */}
      <div className="page-head">
        <div className="min-w-0">
          <h1 className="page-title truncate">{roleTitle}</h1>
          <p className="page-sub">
            Complete audit trail of role-relevant activities and system events
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            onClick={loadHistory}
            title="Refresh"
            aria-label="Refresh"
            className="btn-secondary btn-icon"
          >
            <HiOutlineRefresh size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            aria-label="Export CSV"
            className="btn-primary"
          >
            <HiOutlineDownload size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─── Summary bar ─── */}
      {!loading && pagination.total > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-neutral">
            <HiOutlineDocumentText size={13} aria-hidden="true" />
            <span className="tabular-nums text-fg">{pagination.total}</span>
            <span>total records</span>
          </span>
          <span className="badge badge-neutral">
            <HiOutlineCalendar size={13} aria-hidden="true" />
            {dateRange === 'all' ? 'All time' : DATE_RANGES.find(d => d.value === dateRange)?.label}
          </span>
          {category !== 'All' && (
            <span className="badge badge-primary">
              <HiOutlineFilter size={13} aria-hidden="true" />
              {category}
            </span>
          )}
        </div>
      )}

      {/* ─── Filter toolbar ─── */}
      <div className="card flex flex-col gap-2.5">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <HiOutlineSearch
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
            size={16}
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search by keyword, actor, or title…"
            aria-label="Search activity"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 pr-10"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => { setSearch(''); setPage(1); loadHistory(); }}
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-fg-faint transition hover:bg-hover hover:text-fg"
            >
              <HiOutlineX size={16} aria-hidden="true" />
            </button>
          )}
        </form>

        {/* Selectors */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <div className="relative col-span-2 min-w-0 sm:col-span-1">
            <HiOutlineAdjustments size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint" aria-hidden="true" />
            <select
              value={category}
              aria-label="Filter by category"
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="input-field cursor-pointer pl-8"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="relative min-w-0">
            <HiOutlineFilter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint" aria-hidden="true" />
            <select
              value={status}
              aria-label="Filter by status"
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="input-field cursor-pointer pl-8"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="relative min-w-0">
            <HiOutlineCalendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint" aria-hidden="true" />
            <select
              value={dateRange}
              aria-label="Filter by date range"
              onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
              className="input-field cursor-pointer pl-8"
            >
              {DATE_RANGES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end">
            <button type="button" onClick={handleResetFilters} className="btn-danger btn-sm">
              <HiOutlineX size={14} aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Activity timeline ─── */}
      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton h-20" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="card">
          <div className="empty py-10">
            <span className="stat-icon h-12 w-12">
              <HiOutlineClock size={24} aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-fg">No activity records found</p>
            <p className="max-w-xs text-xs">
              Try adjusting your filters or search terms to find matching records.
            </p>
            {hasActiveFilters && (
              <button type="button" onClick={handleResetFilters} className="btn-secondary mt-2">
                Reset Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([dateLabel, groupItems]) => (
            <section key={dateLabel} className="flex flex-col gap-2">
              {/* Date group header */}
              <div className="flex items-center gap-2.5 px-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                  <HiOutlineCalendar size={14} aria-hidden="true" />
                  <span>{dateLabel}</span>
                </div>
                <hr className="divider flex-1" />
                <span className="badge badge-neutral tabular-nums">
                  {groupItems.length} {groupItems.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              {/* Activity items */}
              <div className="flex flex-col gap-2">
                {groupItems.map((act) => (
                  <ActivityItem key={act.id} activity={act} isCompact={false} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ─── Pagination footer ─── */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <p className="text-xs text-fg-muted">
            Page{' '}
            <strong className="font-bold tabular-nums text-fg">{pagination.page}</strong>
            {' '}of{' '}
            <strong className="font-bold tabular-nums text-fg">{pagination.totalPages}</strong>
            {' '}—{' '}
            <span className="tabular-nums">{pagination.total} total records</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              aria-label="Previous page"
              className="btn-secondary"
            >
              <HiOutlineChevronLeft size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <span className="badge badge-primary min-w-[40px] justify-center py-2 text-xs tabular-nums" aria-current="page">
              {page}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={page >= pagination.totalPages}
              aria-label="Next page"
              className="btn-secondary"
            >
              <span className="hidden sm:inline">Next</span>
              <HiOutlineChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}