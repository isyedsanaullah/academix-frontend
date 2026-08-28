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
    <div
      style={{
        padding: '20px',
        borderRadius: '16px',
        background: 'var(--card-bg, #0d1117)',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
      className="glass-card"
    >
      {/* Widget Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiOutlineClock size={16} style={{ color: '#818cf8' }} />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary, #ffffff)', margin: 0 }}>
            Recent Activity
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadActivities}
            title="Refresh logs"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary, rgba(255, 255, 255, 0.4))',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <HiOutlineRefresh size={14} />
          </button>
          <Link
            href={historyPath}
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'rgba(99,102,241,0.08)',
              transition: 'all 0.15s',
            }}
          >
            View All Activity <HiOutlineArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Content State */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0' }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
          Unable to load recent activity.
        </div>
      ) : activities.length === 0 ? (
        <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
          No recent activity reported.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activities.map((act) => (
            <ActivityItem key={act.id} activity={act} isCompact={true} />
          ))}
        </div>
      )}
    </div>
  );
}
