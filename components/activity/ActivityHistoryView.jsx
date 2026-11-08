'use client';

import { useState, useEffect } from 'react';
import { fetchActivityLogs } from '../../services/activity.service';
import ActivityItem from './ActivityItem';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Search from '@/components/ui/Search';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/common/Pagination';
import Icon from '@/components/Icon';

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
  { name: 'All Time', id: 'all' },
  { name: 'Today', id: 'today' },
  { name: 'Yesterday', id: 'yesterday' },
  { name: 'Last 7 Days', id: '7days' },
  { name: 'Last 30 Days', id: '30days' },
];

const STATUSES = ['All', 'completed', 'verified', 'pending', 'failed', 'rejected'];

export default function ActivityHistoryView({ role = 'student', roleTitle = 'Activity History' }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [dateRange, setDateRange] = useState('all');
  const [page, setPage] = useState(1);

  const hasActiveFilters =
    category !== 'All' || status !== 'All' || dateRange !== 'all' || search.trim() !== '';

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
    if (e?.preventDefault) e.preventDefault();
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

  const handleExportCSV = () => {
    if (!logs || logs.length === 0) return;

    const headers = [
      'ID',
      'Date',
      'Time',
      'Category',
      'Action',
      'Title',
      'Description',
      'Actor',
      'Role',
      'Status',
    ];
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

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${role}_activity_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <div className="page-head">
        <div className="min-w-0">
          <h1 className="page-title truncate">{roleTitle}</h1>
          <p className="page-sub">
            Complete audit trail of role-relevant activities and system events
          </p>
        </div>

        <div className="page-actions">
          <Button
            isStroke
            isCircle
            icon="refresh"
            onClick={loadHistory}
            aria-label="Refresh activity logs"
          />
          <Button
            isPrimary
            icon="download"
            onClick={handleExportCSV}
            disabled={logs.length === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {!loading && pagination.total > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="label label-gray">
            <Icon name="document" size={13} className="fill-current" aria-hidden="true" />
            <span className="tabular-nums text-t-primary font-bold">{pagination.total}</span>
            <span>total records</span>
          </span>
          <span className="label label-gray">
            <Icon name="calendar" size={13} className="fill-current" aria-hidden="true" />
            {dateRange === 'all'
              ? 'All time'
              : DATE_RANGES.find((d) => d.id === dateRange)?.name}
          </span>
          {category !== 'All' && (
            <span className="label label-blue">
              <Icon name="filter" size={13} className="fill-current" aria-hidden="true" />
              {category}
            </span>
          )}
        </div>
      )}

      <Card className="flex flex-col gap-3">
        <Search
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSubmit={handleSearchSubmit}
          onClear={() => {
            setSearch('');
            setPage(1);
            loadHistory();
          }}
          placeholder="Search by keyword, actor, or title…"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            value={category}
            onChange={(opt) => {
              setCategory(typeof opt === 'object' ? opt.id : opt);
              setPage(1);
            }}
            options={CATEGORIES.map((c) => ({
              id: c,
              name: c === 'All' ? 'All Categories' : c,
            }))}
          />
          <Select
            value={status}
            onChange={(opt) => {
              setStatus(typeof opt === 'object' ? opt.id : opt);
              setPage(1);
            }}
            options={STATUSES.map((s) => ({
              id: s,
              name: s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1),
            }))}
          />
          <Select
            value={dateRange}
            onChange={(opt) => {
              setDateRange(typeof opt === 'object' ? opt.id : opt);
              setPage(1);
            }}
            options={DATE_RANGES}
          />
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button isDanger size="sm" icon="close" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="flex flex-col gap-2.5" aria-busy="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="skeleton h-20 rounded-3xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <EmptyState
            icon="clock"
            title="No activity records found"
            description="Try adjusting your filters or search terms to find matching records."
            action={
              hasActiveFilters ? (
                <Button isStroke onClick={handleResetFilters}>
                  Reset Filters
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {Object.entries(grouped).map(([dateLabel, groupItems]) => (
            <section key={dateLabel} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3 px-1">
                <div className="flex items-center gap-1.5 text-caption font-bold uppercase tracking-wider text-[var(--brand-blue)]">
                  <Icon name="calendar" size={14} className="fill-current" aria-hidden="true" />
                  <span>{dateLabel}</span>
                </div>
                <hr className="divider flex-1" />
                <span className="label label-gray tabular-nums">
                  {groupItems.length} {groupItems.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {groupItems.map((act) => (
                  <ActivityItem key={act.id || act._id} activity={act} isCompact={false} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}
