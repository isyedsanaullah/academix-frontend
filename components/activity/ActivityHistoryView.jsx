'use client';

import { useState, useEffect } from 'react';
import { fetchActivityLogs } from '../../services/activity.service';
import ActivityItem from './ActivityItem';
import {
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineCalendar,
  HiOutlineDownload,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineRefresh,
  HiOutlineClock,
  HiOutlineOfficeBuilding,
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

  // Group logs by Date headers (Today, Yesterday, Earlier)
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
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <HiOutlineClock className="text-indigo-400" size={24} /> {roleTitle}
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Complete history of role-relevant activities and system events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.08] transition text-xs flex items-center gap-1"
          >
            <HiOutlineRefresh size={14} /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="px-3 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 transition text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <HiOutlineDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#0d1117] border border-white/[0.06] flex flex-col md:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input
            type="text"
            placeholder="Search activity by keyword, actor, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
          />
        </form>

        {/* Category Selector */}
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-[#0d1117] text-white">
              Category: {c}
            </option>
          ))}
        </select>

        {/* Date Range Selector */}
        <select
          value={dateRange}
          onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
          className="px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500"
        >
          {DATE_RANGES.map((d) => (
            <option key={d.value} value={d.value} className="bg-[#0d1117] text-white">
              Date: {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Main Activity Timeline */}
      {loading ? (
        <div className="space-y-3 py-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#0d1117] border border-white/[0.06]">
          <HiOutlineClock size={36} className="mx-auto text-white/20 mb-3" />
          <p className="text-sm font-semibold text-white/70">No activity records found</p>
          <p className="text-xs text-white/40 mt-1">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, groupItems]) => (
            <div key={dateLabel} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider px-1">
                <HiOutlineCalendar size={14} />
                <span>{dateLabel}</span>
                <span className="text-[10px] text-white/30 font-normal">({groupItems.length})</span>
              </div>
              <div className="space-y-2">
                {groupItems.map((act) => (
                  <ActivityItem key={act.id} activity={act} isCompact={false} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] flex-wrap gap-3">
          <p className="text-xs text-white/40">
            Showing Page <strong className="text-white">{pagination.page}</strong> of <strong className="text-white">{pagination.totalPages}</strong> ({pagination.total} records)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.08]"
            >
              <HiOutlineChevronLeft size={16} />
            </button>

            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {page}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={page >= pagination.totalPages}
              className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.08]"
            >
              <HiOutlineChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
