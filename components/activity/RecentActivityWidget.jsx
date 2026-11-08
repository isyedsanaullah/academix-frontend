'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchActivityLogs } from '../../services/activity.service';
import ActivityItem from './ActivityItem';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/Icon';

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

  const historyPath = `/${role}/activity-log`;

  return (
    <Card
      title="Recent Activity"
      subtitle="Latest system audit trails and operational logs"
      headContent={
        <div className="flex shrink-0 items-center gap-2">
          <Button
            isStroke
            isCircle
            size="sm"
            icon="refresh"
            onClick={loadActivities}
            aria-label="Refresh logs"
          />
          <Link
            href={historyPath}
            className="inline-flex h-10 items-center gap-1.5 rounded-3xl border border-s-stroke2 bg-b-surface2 px-4 text-button text-t-secondary transition-colors hover:border-s-highlight hover:text-t-primary"
          >
            <span>View All</span>
            <Icon name="arrow" size={16} className="fill-current" aria-hidden="true" />
          </Link>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-2.5" aria-busy="true">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="empty">Unable to load recent activity logs.</div>
      ) : activities.length === 0 ? (
        <div className="empty">No recent activity reported.</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {activities.map((act) => (
            <ActivityItem key={act.id || act._id} activity={act} isCompact={true} />
          ))}
        </div>
      )}
    </Card>
  );
}
