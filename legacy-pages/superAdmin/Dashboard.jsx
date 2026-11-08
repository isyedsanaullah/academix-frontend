import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import RecentActivityWidget from '../../components/activity/RecentActivityWidget';
import CollegesHubLoader from '../../components/common/CollegesHubLoader';
import PlanBadge from '../../components/common/PlanBadge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-s-stroke2 bg-b-surface2 p-3 text-caption shadow-depth">
        <p className="mb-1 font-semibold text-t-secondary">{label}</p>
        <p className="font-bold tabular-nums text-[var(--brand-blue)]">
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dash, ov] = await Promise.all([
          api.get('/super-admin/dashboard'),
          api.get('/analytics/overview').catch(() => ({ data: { data: null } })),
        ]);
        setData(dash.data.data);
        setAnalytics(ov.data.data);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="page flex items-center justify-center min-h-[420px]" aria-busy="true">
        <CollegesHubLoader
          size="md"
          text="Loading platform control center…"
          minHeight="min-h-[380px]"
        />
      </div>
    );
  }

  const s = data?.stats || {};
  const plans = data?.planDistribution || {};
  const recentColleges = data?.recentColleges || [];

  const totalForPct = s.totalColleges || 1;
  const activeShare = s.totalColleges
    ? Math.round(((s.activeColleges || 0) / s.totalColleges) * 100)
    : 0;

  const kpiRibbon = [
    {
      label: 'Total Colleges',
      value: s.totalColleges || 0,
      icon: 'building',
      tone: 'text-t-primary',
    },
    {
      label: 'Active Colleges',
      value: s.activeColleges || 0,
      icon: 'shield',
      tone: 'text-[var(--brand-green-text)]',
    },
    {
      label: 'Total Users',
      value: s.totalUsers || 0,
      icon: 'users',
      tone: 'text-t-primary',
    },
    {
      label: 'Total Students',
      value: s.totalStudents || 0,
      icon: 'graduation-cap',
      tone: 'text-t-primary',
    },
    {
      label: 'Suspended',
      value: s.suspendedColleges || 0,
      icon: 'alert',
      tone: (s.suspendedColleges || 0) > 0 ? 'text-[var(--danger)]' : 'text-t-primary',
    },
    {
      label: 'Active Share',
      value: `${activeShare}%`,
      icon: 'trending-up',
      tone: 'text-[var(--brand-blue)]',
    },
  ];

  const planData = [
    {
      id: 'starter',
      name: 'Starter (Basic)',
      count: (plans.starter || 0) + (plans.basic || 0),
      color: 'var(--chart-2)',
    },
    {
      id: 'standard',
      name: 'Standard',
      count: plans.standard || 0,
      color: 'var(--chart-1)',
    },
    {
      id: 'premium',
      name: 'Premium (Plus)',
      count: (plans.premium || 0) + (plans.plus || 0),
      color: 'var(--chart-3)',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      count: plans.enterprise || 0,
      color: 'var(--chart-4)',
    },
  ];

  const hasGrowth = analytics?.monthlyRegistrations?.length > 0;
  const hasLogins = analytics?.dailyLogins?.length > 0;

  return (
    <div className="page">
      {/* 1. Command Center Header */}
      <div className="page-head">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="page-title">Platform Command Center</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-[var(--brand-blue-soft)] to-[var(--brand-green-soft)] border border-s-stroke2 px-3 py-1 text-caption font-bold text-[var(--brand-blue)]">
              <span className="w-2 h-2 rounded-full bg-[var(--brand-green)] animate-pulse" />
              Global Multi-Tenant Control
            </span>
          </div>
          <p className="page-sub">
            Real-time operational telemetry, tenant subscriptions, and system-wide activity across
            all registered colleges
          </p>
        </div>
        <div className="page-actions">
          <Button
            isStroke
            icon="bar-chart"
            onClick={() => navigate('/super-admin/analytics')}
          >
            Analytics
          </Button>
          <Button
            isPrimary
            icon="building"
            onClick={() => navigate('/super-admin/colleges')}
          >
            Manage Colleges
          </Button>
        </div>
      </div>

      {/* 2. Denser 6-KPI Command Ribbon */}
      <div className="rounded-4xl bg-b-surface2 border border-s-stroke2 p-2 shadow-depth">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
          {kpiRibbon.map((c) => (
            <div
              key={c.label}
              className="rounded-3xl bg-b-surface1 border border-s-subtle p-4 flex flex-col justify-between gap-2.5 transition-colors hover:border-s-stroke2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-caption font-semibold text-t-secondary truncate">
                  {c.label}
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-b-surface2 border border-s-subtle text-[var(--brand-blue)]">
                  <Icon name={c.icon} size={16} className="fill-current" aria-hidden="true" />
                </span>
              </div>
              <div className={`text-h4 font-mono tabular-nums ${c.tone}`}>
                {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Subscription Tier Distribution & Recently Onboarded Colleges */}
      <div className="split split-even">
        {/* Subscription Tier Distribution */}
        <Card
          title="Subscription Tier Distribution"
          subtitle="Active tenant breakdown by subscription plan"
          headContent={
            <Button
              isStroke
              size="sm"
              icon="arrow"
              onClick={() => navigate('/super-admin/subscriptions')}
            >
              Subscriptions
            </Button>
          }
        >
          <div className="flex flex-col gap-4">
            {planData.map((p) => {
              const pct = Math.round((p.count / totalForPct) * 100);
              return (
                <div key={p.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 text-caption">
                    <span className="flex min-w-0 items-center gap-2.5 font-semibold text-t-primary">
                      <PlanBadge plan={p.id} />
                      <span className="truncate text-t-secondary">{p.name}</span>
                    </span>
                    <span className="shrink-0 font-mono font-semibold tabular-nums text-t-primary">
                      {p.count} colleges ({pct}%)
                    </span>
                  </div>
                  <div className="progress" role="img" aria-label={`${p.name}: ${pct}%`}>
                    <i style={{ width: `${Math.max(pct, p.count > 0 ? 6 : 0)}%`, background: p.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recently Onboarded Colleges */}
        <Card
          title="Recently Onboarded Colleges"
          subtitle="Latest tenant workspaces provisioned on the platform"
          headContent={
            <Button
              isStroke
              size="sm"
              icon="arrow"
              onClick={() => navigate('/super-admin/colleges')}
            >
              View All
            </Button>
          }
        >
          {recentColleges.length === 0 ? (
            <div className="empty">No colleges registered yet</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recentColleges.map((c) => (
                <div
                  key={c._id}
                  onClick={() => navigate(`/super-admin/colleges/${c._id}`)}
                  className="flex items-center gap-3.5 rounded-2xl border border-s-subtle bg-b-surface1 p-3 transition-colors hover:border-s-highlight cursor-pointer"
                >
                  <div
                    className="avatar h-10 w-10 rounded-2xl shrink-0 uppercase font-mono text-caption"
                    aria-hidden="true"
                  >
                    {c.code?.slice(0, 2) || 'CH'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sub-title-2 text-t-primary" title={c.name}>
                      {c.name}
                    </p>
                    <p className="truncate text-caption font-mono tabular-nums text-t-tertiary">
                      {c.code} · {(c.totalStudents || 0).toLocaleString()} students
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.subscription?.plan && (
                      <PlanBadge
                        plan={c.subscription.plan}
                        status={c.subscription?.status || 'active'}
                      />
                    )}
                    <span
                      className={`label capitalize ${
                        c.subscription?.status === 'active' ? 'label-green' : 'label-red'
                      }`}
                    >
                      {c.subscription?.status || 'inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 4. Platform Telemetry Charts (Brand Blue + Brand Green) */}
      {(hasGrowth || hasLogins) && (
        <div className="split split-even">
          {hasGrowth && (
            <Card
              title="User Growth (12 Months)"
              subtitle="Cumulative platform user registrations"
            >
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analytics.monthlyRegistrations}
                    margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gPlatformUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--chart-grid)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={16}
                    />
                    <YAxis
                      width={36}
                      tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="var(--chart-1)"
                      strokeWidth={2.5}
                      fill="url(#gPlatformUsers)"
                      name="Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {hasLogins && (
            <Card
              title="Daily Logins (30 Days)"
              subtitle="Authenticated sessions across all tenant portals"
            >
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.dailyLogins}
                    margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--chart-grid)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={16}
                    />
                    <YAxis
                      width={36}
                      tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomChartTooltip />}
                      cursor={{ fill: 'var(--backgrounds-highlight)', opacity: 0.45 }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--chart-2)"
                      radius={[6, 6, 0, 0]}
                      name="Logins"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 5. System Activity Feed */}
      <RecentActivityWidget role="super-admin" />
    </div>
  );
};

export default SuperAdminDashboard;
