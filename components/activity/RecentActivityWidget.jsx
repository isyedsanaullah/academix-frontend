'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchActivityLogs } from '../../services/activity.service';
import ActivityItem from './ActivityItem';
import { HiOutlineClock, HiOutlineArrowRight, HiOutlineRefresh } from 'react-icons/hi';

export default function RecentActivityWidget({ role = 'student', limit = 5 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadActivities = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchActivityLogs({ page: 1, limit });
      setActivities(res?.data || []);
    } catch (err) {
      console.error('Failed to load recent activities:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [role, limit]);

  // View All Route mapping based on role
  const historyPath = `/${role}/activity-log`;

  return (
    <div className="card">
      {/* Widget header */}
      <div className="card-head">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="stat-icon">
            <HiOutlineClock size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="card-title truncate">Recent Activity</h3>
            <p className="card-sub">Latest system audit trails and operational logs</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={loadActivities}
            title="Refresh logs"
            aria-label="Refresh logs"
            className="btn-ghost btn-sm btn-icon"
          >
            <HiOutlineRefresh size={16} aria-hidden="true" />
          </button>
          <Link href={historyPath} className="btn-ghost btn-sm">
            <span>View All</span>
            <HiOutlineArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Content state */}
      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="empty">Unable to load recent activity logs.</div>
      ) : activities.length === 0 ? (
        <div className="empty">No recent activity reported.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {activities.map((act) => (
            <ActivityItem key={act.id} activity={act} isCompact={true} />
          ))}
        </div>
      )}
    </div>
  );
}