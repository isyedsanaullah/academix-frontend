import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Icon from '../Icon';
import CollegesHubLoader from './CollegesHubLoader';

const categoryConfig = {
  general: { cls: 'label-blue', label: 'General' },
  academic: { cls: 'label-blue', label: 'Academic' },
  fee: { cls: 'label-red', label: 'Finance' },
  exam: { cls: 'label-yellow', label: 'Exams' },
  event: { cls: 'label-green', label: 'Event' },
  admission: { cls: 'label-blue', label: 'Admission' },
};

const priorityConfig = {
  urgent: { cls: 'label-red', label: 'Urgent' },
  high: { cls: 'label-yellow', label: 'High Alert' },
  medium: { cls: 'label-blue', label: 'Medium' },
  low: { cls: 'label-gray', label: 'Low' },
};

const RecentAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [user?.role]);

  const fetchAnnouncements = async () => {
    try {
      const { data: res } = await api.get('/announcements');
      if (res.success) {
        const list = res.data || [];
        const role = user?.role?.toLowerCase() || '';
        let allowedAudience = ['all'];
        if (role === 'teacher') {
          allowedAudience = ['all', 'teachers'];
        } else if (role === 'student') {
          allowedAudience = ['all', 'students'];
        } else if (role === 'admin' || role === 'principal' || role === 'superadmin') {
          allowedAudience = ['all', 'students', 'teachers', 'employees', 'public'];
        } else {
          allowedAudience = ['all', 'employees'];
        }

        const filtered = list.filter((ann) => {
          const audience = ann.audience || 'all';
          return allowedAudience.includes(audience);
        });

        setAnnouncements(filtered.slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <Card className="flex items-center justify-center min-h-[160px]">
        <CollegesHubLoader size="sm" text="Loading announcements..." minHeight="min-h-[120px]" />
      </Card>
    );
  }

  return (
    <Card
      title="Recent Announcements"
      subtitle="Official updates & notices"
      headContent={
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]">
          <Icon name="megaphone" size={18} className="fill-current" />
        </div>
      }
    >
      {announcements.length === 0 ? (
        <EmptyState
          icon="bell"
          title="No active announcements"
          description="Check back later for any new notices."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((ann) => {
            const isExpanded = expandedId === ann._id;
            const cat = categoryConfig[ann.category] || categoryConfig.general;
            const prio = priorityConfig[ann.priority] || priorityConfig.medium;

            return (
              <div
                key={ann._id}
                className={`group rounded-2xl border p-4 transition-colors cursor-pointer ${
                  ann.priority === 'urgent'
                    ? 'border-[var(--danger)]/30 bg-[var(--danger-soft)]/40'
                    : 'border-s-subtle bg-b-surface1 hover:border-s-highlight'
                }`}
                onClick={() => toggleExpand(ann._id)}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`label uppercase ${cat.cls}`}>{cat.label}</span>
                  {(ann.priority === 'urgent' || ann.priority === 'high') && (
                    <span className={`label uppercase ${prio.cls}`}>{prio.label}</span>
                  )}
                  <span className="ml-auto inline-flex items-center gap-1 text-caption font-mono text-t-tertiary">
                    <Icon name="calendar" size={12} className="fill-current" />
                    {new Date(ann.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sub-title-2 text-t-primary group-hover:text-[var(--brand-blue)] transition-colors">
                    {ann.title}
                  </h4>
                  <Icon
                    name="chevron"
                    size={16}
                    className={`shrink-0 fill-t-tertiary transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                <div
                  className={`mt-2 overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'max-h-[300px] opacity-100' : 'max-h-5 opacity-70'
                  }`}
                >
                  <p
                    className={`text-caption text-t-secondary leading-relaxed ${
                      isExpanded ? 'whitespace-pre-line' : 'truncate'
                    }`}
                  >
                    {ann.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default RecentAnnouncements;
