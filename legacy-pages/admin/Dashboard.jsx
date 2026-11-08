import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import RecentActivityWidget from '../../components/activity/RecentActivityWidget';
import OnboardingChecklistWidget from '../../components/admin/OnboardingChecklistWidget';
import CollegesHubLoader from '../../components/common/CollegesHubLoader';
import PlanBadge from '../../components/common/PlanBadge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import OverviewTabsCard from '../../components/ui/OverviewTabsCard';
import Percentage from '../../components/ui/Percentage';
import Icon from '../../components/Icon';
import {
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-s-stroke2 bg-b-surface2 p-3.5 text-caption shadow-depth">
        <p className="font-semibold text-t-secondary mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={`item-${index}`}
            className="font-bold text-t-primary flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.payload?.fill || entry.color }}
              />
              {entry.name}:
            </span>
            <span className="tabular-nums">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMetricId, setActiveMetricId] = useState('students');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: res } = await api.get('/colleges/dashboard');
        setData(res.data);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[380px] w-full p-6">
        <CollegesHubLoader size="md" text="Loading college dashboard…" />
      </div>
    );
  }

  const s = data?.stats || {};
  const attendMap = {};
  (data?.attendanceToday || []).forEach((a) => {
    attendMap[a._id] = a.count;
  });
  const totalPresent = attendMap.present || 0;
  const totalAbsent = attendMap.absent || 0;
  const totalLate = attendMap.late || 0;
  const totalLeave = attendMap.leave || 0;
  const totalMarked = totalPresent + totalAbsent + totalLate + totalLeave;
  const attPct = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  const activeRate =
    s.totalStudents > 0 ? Math.round(((s.activeStudents || 0) / s.totalStudents) * 100) : 100;

  const overviewTabs = [
    {
      id: 'students',
      label: 'Total Students',
      icon: 'graduation-cap',
      value: (s.totalStudents || 0).toLocaleString(),
      percentage: activeRate,
      subtitle: 'enrolled in current session',
      onClick: () => navigate('/admin/students'),
    },
    {
      id: 'active-students',
      label: 'Active Students',
      icon: 'check-circle',
      value: (s.activeStudents || 0).toLocaleString(),
      percentage: activeRate,
      subtitle: 'verified active roster',
      onClick: () => navigate('/admin/students'),
    },
    {
      id: 'teachers',
      label: 'Total Teachers',
      icon: 'users',
      value: (s.totalTeachers || 0).toLocaleString(),
      subtitle: 'faculty across departments',
      onClick: () => navigate('/admin/staff'),
    },
    {
      id: 'employees',
      label: 'Employees & Staff',
      icon: 'briefcase',
      value: (s.totalEmployees || 0).toLocaleString(),
      subtitle: 'campus support personnel',
      onClick: () => navigate('/admin/staff'),
    },
  ];

  // Colour-blind-safe max-4 series palette with direct labels
  const attendanceChartData = [
    { status: 'Present', count: totalPresent, fill: 'var(--chart-2)' },
    { status: 'Late', count: totalLate, fill: 'var(--chart-3)' },
    { status: 'Leave', count: totalLeave, fill: 'var(--chart-1)' },
    { status: 'Absent', count: totalAbsent, fill: 'var(--chart-4)' },
  ];

  const collegePlan =
    data?.college?.subscription?.plan || user?.college?.subscription?.plan || 'standard';
  const collegeSubStatus =
    data?.college?.subscription?.status || user?.college?.subscription?.status || 'active';

  return (
    <div className="page">
      {/* Optional Setup Checklist */}
      <OnboardingChecklistWidget />

      {/* 1. Top Header */}
      <div className="page-head">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1.5">
            <h1 className="page-title">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'}
            </h1>
            {data?.college && (
              <div className="inline-flex items-center gap-2 rounded-full border border-s-stroke2 bg-b-surface2 px-3.5 py-1 text-caption font-semibold text-t-secondary">
                <Icon name="building" size={14} className="fill-[var(--brand-blue)]" />
                <span className="text-t-primary font-bold">{data.college.name}</span>
                <span className="font-mono text-t-tertiary">({data.college.code})</span>
                <PlanBadge plan={collegePlan} status={collegeSubStatus} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-caption text-t-secondary">
            <Icon name="calendar" size={15} className="fill-[var(--brand-blue)]" />
            <span>{today}</span>
          </div>
        </div>

        <div className="page-actions">
          <Button
            isStroke
            icon="clipboard-check"
            onClick={() => navigate('/admin/attendance')}
          >
            Mark Attendance
          </Button>
          <Button
            isPrimary
            icon="graduation-cap"
            onClick={() => navigate('/admin/students')}
          >
            Manage Students
          </Button>
        </div>
      </div>

      {/* 2. Core 2.0 Segmented Overview Tray */}
      <OverviewTabsCard
        title="Campus Overview"
        tabs={overviewTabs}
        activeId={activeMetricId}
        onSelect={(id) => {
          setActiveMetricId(id);
          const item = overviewTabs.find((t) => t.id === id);
          if (item?.onClick) item.onClick();
        }}
        headRight={
          <div className="flex items-center gap-2">
            <span className="label label-green">Live Session</span>
          </div>
        }
      />

      {/* 3. Operations & Analytics Row (Core 2.0 ColLeft / ColRight rhythm) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 w-full">
        {/* Left 7 Cols: Today's Attendance + Distribution Chart */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <Card
            title="Today's Attendance"
            subtitle={
              totalMarked > 0
                ? `${attPct}% total presence rate across ${totalMarked} marked records`
                : 'Attendance marking is in progress for today'
            }
            headContent={
              <Button
                isStroke
                size="sm"
                icon="arrow"
                onClick={() => navigate('/admin/attendance')}
              >
                Mark Now
              </Button>
            }
          >
            {/* Progress Bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-caption mb-2">
                <span className="font-semibold text-t-secondary">Overall Presence Rate</span>
                <Percentage value={attPct || 0} />
              </div>
              <div className="progress">
                <i style={{ width: `${Math.max(attPct, 4)}%` }} />
              </div>
            </div>

            {/* 4-Status Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                {
                  label: 'Present',
                  count: totalPresent,
                  badge: 'label-green',
                  dot: 'bg-[var(--chart-2)]',
                },
                {
                  label: 'Late',
                  count: totalLate,
                  badge: 'label-yellow',
                  dot: 'bg-[var(--chart-3)]',
                },
                {
                  label: 'On Leave',
                  count: totalLeave,
                  badge: 'label-blue',
                  dot: 'bg-[var(--chart-1)]',
                },
                {
                  label: 'Absent',
                  count: totalAbsent,
                  badge: 'label-red',
                  dot: 'bg-[var(--chart-4)]',
                },
              ].map((a) => (
                <div
                  key={a.label}
                  className="p-4 rounded-3xl bg-b-surface1 border border-s-subtle flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-caption font-semibold text-t-secondary">{a.label}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${a.dot}`} />
                  </div>
                  <p className="text-h4 font-mono text-t-primary tabular-nums">{a.count}</p>
                </div>
              ))}
            </div>

            {/* Colour-blind-safe 4-series Bar Chart */}
            <div className="pt-4 border-t border-s-subtle">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sub-title-2 text-t-primary">
                  Attendance Breakdown (Colour-Blind-Safe Palette)
                </span>
                <span className="text-caption text-t-tertiary">Direct bar values enabled</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={attendanceChartData}
                    margin={{ top: 20, right: 12, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--chart-grid)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="status"
                      tick={{ fontSize: 12, fill: 'var(--chart-axis)', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomChartTooltip />}
                      cursor={{ fill: 'var(--backgrounds-highlight)', opacity: 0.5 }}
                    />
                    <Bar dataKey="count" radius={[10, 10, 0, 0]} name="Students" maxBarSize={56}>
                      {attendanceChartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="top"
                        style={{
                          fill: 'var(--text-primary)',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Gate & Campus Security */}
          <Card
            title="Gate & Campus Security"
            subtitle="Real-time campus entries and visitor records"
            headContent={
              <Button
                isStroke
                size="sm"
                icon="arrow"
                onClick={() => navigate('/admin/visitors')}
              >
                Visitor Logs
              </Button>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Students Inside',
                  count: s.currentlyInsideStudents || 0,
                  sub: 'Active on campus',
                  icon: 'graduation-cap',
                },
                {
                  label: 'Staff Inside',
                  count: s.currentlyInsideStaff || 0,
                  sub: 'Faculty & personnel',
                  icon: 'users',
                },
                {
                  label: 'Entries / Exits',
                  count: `${s.todayEntries || 0} / ${s.todayExits || 0}`,
                  sub: 'Total scanned today',
                  icon: 'qrcode',
                },
                {
                  label: 'Visitors Logged',
                  count: s.todayVisitors || 0,
                  sub: 'Guest registrations',
                  icon: 'shield',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-3xl bg-b-surface1 border border-s-subtle flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-2xl bg-b-surface2 border border-s-subtle flex items-center justify-center text-[var(--brand-blue)]">
                      <Icon name={item.icon} size={18} className="fill-current" />
                    </span>
                  </div>
                  <div>
                    <p className="text-h5 font-mono text-t-primary tabular-nums">{item.count}</p>
                    <p className="text-sub-title-2 text-t-primary mt-0.5">{item.label}</p>
                    <p className="text-caption text-t-tertiary">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 5 Cols: Fee Collection + Quick Actions + Recent Activity */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Fee Collection Status */}
          <Card
            title="Fee Collection Status"
            subtitle="Current billing cycle overview"
            headContent={
              <Button isStroke size="sm" icon="arrow" onClick={() => navigate('/admin/fees')}>
                View Fees
              </Button>
            }
          >
            {(data?.feeStats || []).length === 0 ? (
              <div className="empty py-8">No fee records found for current cycle</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {data.feeStats.map((f) => {
                  const statusBadge = {
                    paid: 'label-green',
                    partial: 'label-yellow',
                    unpaid: 'label-red',
                  };
                  return (
                    <div
                      key={f._id}
                      className="flex items-center justify-between p-4 rounded-3xl bg-b-surface1 border border-s-subtle hover:border-s-stroke2 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`label capitalize ${statusBadge[f._id] || 'label-gray'}`}>
                          {f._id}
                        </span>
                        <span className="text-caption font-medium text-t-secondary">
                          {f.count} students
                        </span>
                      </div>
                      <span className="text-sub-title-1 font-mono text-t-primary tabular-nums">
                        Rs. {(f.total || 0).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Quick Administrative Actions */}
          <Card
            title="Quick Administrative Actions"
            subtitle="Frequently accessed workflows & portals"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  label: 'Add New Student',
                  icon: 'graduation-cap',
                  path: '/admin/students',
                },
                {
                  label: 'Mark Attendance',
                  icon: 'clipboard-check',
                  path: '/admin/attendance',
                },
                {
                  label: 'Enter Results',
                  icon: 'bar-chart',
                  path: '/admin/results/entry',
                },
                {
                  label: 'Post Announcement',
                  icon: 'megaphone',
                  path: '/admin/announcements',
                },
                {
                  label: 'Fee Defaulters',
                  icon: 'alert',
                  path: '/admin/fees/defaulters',
                },
                {
                  label: 'Campus Settings',
                  icon: 'cog',
                  path: '/admin/settings',
                },
              ].map((a) => (
                <button
                  key={a.path}
                  type="button"
                  onClick={() => navigate(a.path)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-b-surface1 border border-s-subtle hover:border-s-highlight hover:bg-b-highlight transition-all text-left group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)] flex items-center justify-center shrink-0">
                    <Icon name={a.icon} size={18} className="fill-current" />
                  </div>
                  <span className="text-sub-title-2 text-t-primary flex-1 truncate">{a.label}</span>
                  <Icon
                    name="arrow"
                    size={16}
                    className="fill-t-tertiary group-hover:fill-[var(--brand-blue)] group-hover:translate-x-0.5 transition-all shrink-0"
                  />
                </button>
              ))}
            </div>
          </Card>

          {/* Recent Activity Widget */}
          <RecentActivityWidget role="admin" limit={4} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
