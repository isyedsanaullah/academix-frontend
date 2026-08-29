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
    <div className="animate-fade-in space-y-6">

      {/* ─── Page Header ─── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <HiOutlineClock size={22} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
              {roleTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
              Complete audit trail of role-relevant activities and system events
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadHistory}
            className="p-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all duration-200 shadow-xs cursor-pointer"
            title="Refresh"
          >
            <HiOutlineRefresh size={16} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all duration-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <HiOutlineDownload size={15} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─── Stats / Summary Bar ─── */}
      {!loading && pagination.total > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] shadow-xs">
            <HiOutlineDocumentText size={14} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">{pagination.total}</span>
            <span className="text-xs text-slate-500 dark:text-white/50">total records</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] shadow-xs">
            <HiOutlineCalendar size={14} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-500 dark:text-white/50">
              {dateRange === 'all' ? 'All time' : DATE_RANGES.find(d => d.value === dateRange)?.label}
            </span>
          </div>
          {category !== 'All' && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
              <HiOutlineFilter size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{category}</span>
            </div>
          )}
        </div>
      )}

      {/* ─── Filter Toolbar ─── */}
      <div className="glass-card p-4">
        <div className="flex flex-col gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <HiOutlineSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by keyword, actor, or title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); loadHistory(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors cursor-pointer"
              >
                <HiOutlineX size={16} />
              </button>
            )}
          </form>

          {/* Selectors Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <HiOutlineAdjustments size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white">
                    {c === 'All' ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 min-w-0">
              <HiOutlineFilter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white capitalize">
                    {s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 min-w-0">
              <HiOutlineCalendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
              <select
                value={dateRange}
                onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                {DATE_RANGES.map((d) => (
                  <option key={d.value} value={d.value} className="bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white">
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 font-bold text-xs transition-all shrink-0 cursor-pointer"
              >
                <HiOutlineX size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Activity Timeline ─── */}
      {loading ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-20 rounded-2xl bg-slate-100 dark:bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center mb-4">
            <HiOutlineClock size={32} className="text-slate-400 dark:text-white/25" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-white/70">No activity records found</p>
          <p className="text-xs text-slate-500 dark:text-white/40 mt-1.5 max-w-xs">
            Try adjusting your filters or search terms to find matching records.
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([dateLabel, groupItems]) => (
            <div key={dateLabel} className="space-y-3">
              {/* Date Group Header */}
              <div className="flex items-center gap-2.5 px-1">
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  <HiOutlineCalendar size={14} />
                  <span>{dateLabel}</span>
                </div>
                <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.06]" />
                <span className="text-[10px] font-bold text-slate-500 dark:text-white/40 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]">
                  {groupItems.length} {groupItems.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              {/* Activity Items */}
              <div className="space-y-2.5">
                {groupItems.map((act) => (
                  <ActivityItem key={act.id} activity={act} isCompact={false} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Pagination Footer ─── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-5 border-t border-slate-200 dark:border-white/[0.06] flex-wrap gap-3">
          <p className="text-xs text-slate-500 dark:text-white/50">
            Page{' '}
            <strong className="text-slate-900 dark:text-white font-extrabold">{pagination.page}</strong>
            {' '}of{' '}
            <strong className="text-slate-900 dark:text-white font-extrabold">{pagination.totalPages}</strong>
            {' '}—{' '}
            <span className="text-slate-600 dark:text-white/60">{pagination.total} total records</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/70 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <HiOutlineChevronLeft size={15} />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <span className="text-xs font-extrabold px-4 py-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/20 min-w-[40px] text-center">
              {page}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={page >= pagination.totalPages}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/70 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <span className="hidden sm:inline">Next</span>
              <HiOutlineChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
