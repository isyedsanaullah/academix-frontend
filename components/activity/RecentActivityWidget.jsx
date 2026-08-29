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
    <div className="glass-card p-4 sm:p-6 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-xs dark:shadow-none flex flex-col gap-4 w-full">
      {/* Widget Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-100 dark:border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/12 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <HiOutlineClock size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white m-0">
              Recent Activity
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-white/40 m-0">
              Latest system audit trails and operational logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={loadActivities}
            title="Refresh logs"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <HiOutlineRefresh size={16} />
          </button>
          <Link
            href={historyPath}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"
          >
            <span>View All</span>
            <HiOutlineArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Content State */}
      {loading ? (
        <div className="flex flex-col gap-2.5 py-2 w-full">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-16 rounded-xl bg-slate-100 dark:bg-white/[0.03] animate-pulse w-full"
            />
          ))}
        </div>
      ) : error ? (
        <div className="py-8 text-center text-slate-500 dark:text-white/40 text-xs w-full">
          Unable to load recent activity logs.
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center text-slate-500 dark:text-white/40 text-xs w-full">
          No recent activity reported.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 w-full">
          {activities.map((act) => (
            <ActivityItem key={act.id} activity={act} isCompact={true} />
          ))}
        </div>
      )}
    </div>
  );
}
