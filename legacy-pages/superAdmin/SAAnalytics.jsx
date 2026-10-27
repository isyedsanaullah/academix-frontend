import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  HiOutlineChartBar,
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineCheckCircle,
  HiOutlineKey,
  HiOutlineTrendingUp,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineRefresh
} from 'react-icons/hi';

// Token-based palette (role accent first, then brand blue / green, then status colours)
const CHART_COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
  'var(--chart-5)', 'var(--chart-6)', 'var(--info)', 'var(--fg-muted)'
];

const PLAN_COLORS = {
  basic: 'var(--fg-faint)',
  standard: 'var(--chart-2)',
  premium: 'var(--chart-5)',
  enterprise: 'var(--chart-4)'
};

const AXIS_TICK = { fontSize: 10, fill: 'currentColor' };
const GRID_PROPS = { strokeDasharray: '3 3', stroke: 'currentColor', strokeOpacity: 0.2 };
const BAR_CURSOR = { fill: 'currentColor', fillOpacity: 0.08 };
const shortName = (v) => (typeof v === 'string' && v.length > 14 ? `${v.slice(0, 13)}…` : v);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[140px] space-y-1.5 rounded-xl border border-line bg-card p-2.5 text-xs shadow-lg">
      {label && (
        <p className="mb-1 border-b border-line pb-1 font-bold text-fg">{label}</p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5 font-semibold text-fg-muted">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: p.color || p.fill || p.payload?.fill }}
              aria-hidden="true"
            />
            <span className="truncate">{p.name || p.dataKey}:</span>
          </span>
          <span className="font-bold tabular-nums text-fg">
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const ChartHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="card-head">
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="stat-icon">
        {Icon ? <Icon size={16} aria-hidden="true" /> : <HiOutlineChartBar size={16} aria-hidden="true" />}
      </span>
      <div className="min-w-0">
        <h3 className="card-title truncate" title={title}>{title}</h3>
        {subtitle && <p className="card-sub">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const SAAnalytics = () => {
  const [overview, setOverview] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [logins, setLogins] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [ov, cl, lg] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/colleges'),
        api.get('/analytics/logins')
      ]);
      setOverview(ov.data?.data || null);
      setColleges(cl.data?.data || []);
      setLogins(lg.data?.data || null);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="page" aria-busy="true">
        <div className="page-head">
          <div className="min-w-0 flex-1">
            <div className="skeleton h-7 w-64 max-w-full" />
            <div className="skeleton mt-2 h-4 w-80 max-w-full" />
          </div>
          <div className="skeleton h-10 w-36" />
        </div>
        <div className="grid grid-cols-2 gap-[var(--gap)] lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-[88px] last:col-span-2 lg:last:col-span-1" />
          ))}
        </div>
        <div className="skeleton h-11 w-full" />
        <div className="split split-even">
          <div className="skeleton h-[300px]" />
          <div className="skeleton h-[300px]" />
        </div>
        <p className="text-center text-xs font-medium text-fg-muted">
          Aggregating platform telemetry and metrics...
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Platform Overview', icon: HiOutlineChartBar },
    { id: 'colleges', label: 'College-wise Comparison', icon: HiOutlineOfficeBuilding },
    { id: 'logins', label: 'Login Trends & Activity', icon: HiOutlineKey },
  ];

  const statCards = [
    { label: 'Total Colleges', value: overview?.totals?.colleges, icon: HiOutlineOfficeBuilding, tone: '' },
    { label: 'Active Colleges', value: overview?.totals?.activeColleges, icon: HiOutlineCheckCircle, tone: 'text-ok' },
    { label: 'Total Users', value: overview?.totals?.users, icon: HiOutlineUserGroup, tone: '' },
    { label: 'Students', value: overview?.totals?.students, icon: HiOutlineAcademicCap, tone: '' },
    { label: 'Teachers', value: overview?.totals?.teachers, icon: HiOutlineBookOpen, tone: '' },
  ];

  const compareHeight = Math.max(300, colleges.length * 60);

  return (
    <div className="page">
      {/* ── 1. Page header ── */}
      <div className="page-head">
        <div className="min-w-0">
          <h1 className="page-title">Platform Analytics & Insights</h1>
          <p className="page-sub">
            Real-time intelligence on college adoption, user growth, and active usage
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={fetchAnalyticsData}
            className="btn-secondary"
            title="Refresh analytics data"
          >
            <HiOutlineRefresh size={16} aria-hidden="true" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI strip ── */}
      <div className="grid grid-cols-2 gap-[var(--gap)] lg:grid-cols-5">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card last:col-span-2 lg:last:col-span-1">
              <div className="stat-top">
                <span className="stat-label">{s.label}</span>
                <span className="stat-icon">
                  <Icon size={16} aria-hidden="true" />
                </span>
              </div>
              <div className={`stat-value ${s.tone}`}>
                {s.value != null ? s.value.toLocaleString() : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. Tabs ── */}
      <div className="tabs" role="tablist" aria-label="Analytics sections">
        {tabs.map((t) => {
          const TabIcon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`analytics-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`analytics-panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className="tab inline-flex items-center gap-2"
            >
              <TabIcon size={16} className="shrink-0" aria-hidden="true" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {tab === 'overview' && (
        <div
          className="page"
          role="tabpanel"
          id="analytics-panel-overview"
          aria-labelledby="analytics-tab-overview"
        >
          <div className="split split-even">
            {/* User registrations */}
            <div className="card">
              <ChartHeader
                icon={HiOutlineTrendingUp}
                title="User Registrations"
                subtitle="Monthly user onboarding trend (last 12 months)"
              />
              <div className="h-[240px] w-full min-w-0 text-fg-faint sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview?.monthlyRegistrations || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...GRID_PROPS} vertical={false} />
                    <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={16} />
                    <YAxis width={32} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#gradUsers)" name="Registered Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* College registrations */}
            <div className="card">
              <ChartHeader
                icon={HiOutlineOfficeBuilding}
                title="College Registrations"
                subtitle="Monthly workspace onboardings"
              />
              <div className="h-[240px] w-full min-w-0 text-fg-faint sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview?.monthlyColleges || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} vertical={false} />
                    <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={16} />
                    <YAxis width={32} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={BAR_CURSOR} />
                    <Bar dataKey="count" fill="var(--chart-3)" radius={[4, 4, 0, 0]} name="Colleges" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[var(--gap)] md:grid-cols-2 xl:grid-cols-3">
            {/* Users by role */}
            <div className="card">
              <ChartHeader
                icon={HiOutlineUserGroup}
                title="Users by Role"
                subtitle="Platform-wide distribution"
              />
              <div className="h-[200px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overview?.roleBreakdown || []}
                      dataKey="count"
                      nameKey="role"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={3}
                      stroke="var(--card)"
                    >
                      {(overview?.roleBreakdown || []).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                {(overview?.roleBreakdown || []).map((item, i) => (
                  <div key={item.role} className="flex min-w-0 items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden="true" />
                    <span className="truncate capitalize text-fg-muted">{item.role}:</span>
                    <span className="font-bold tabular-nums text-fg">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription plans */}
            <div className="card">
              <ChartHeader
                icon={HiOutlineSparkles}
                title="Subscription Plans"
                subtitle="College subscription tiers"
              />
              <div className="h-[200px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overview?.planBreakdown || []}
                      dataKey="count"
                      nameKey="plan"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={3}
                      stroke="var(--card)"
                    >
                      {(overview?.planBreakdown || []).map((entry, i) => (
                        <Cell key={i} fill={PLAN_COLORS[entry.plan?.toLowerCase()] || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                {(overview?.planBreakdown || []).map((entry, i) => (
                  <div key={entry.plan} className="flex min-w-0 items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PLAN_COLORS[entry.plan?.toLowerCase()] || CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden="true" />
                    <span className="truncate capitalize text-fg-muted">{entry.plan}:</span>
                    <span className="font-bold tabular-nums text-fg">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily active users */}
            <div className="card md:col-span-2 xl:col-span-1">
              <ChartHeader
                icon={HiOutlineKey}
                title="Daily Active Users"
                subtitle="Last 30 days login activity"
              />
              <div className="h-[200px] w-full min-w-0 text-fg-faint md:h-[240px] xl:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview?.dailyLogins || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradLogins" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...GRID_PROPS} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'currentColor' }} axisLine={false} tickLine={false} minTickGap={16} />
                    <YAxis width={32} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#gradLogins)" name="Active Logins" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: COLLEGE-WISE COMPARISON ── */}
      {tab === 'colleges' && (
        <div
          className="page"
          role="tabpanel"
          id="analytics-panel-colleges"
          aria-labelledby="analytics-tab-colleges"
        >
          <div className="card">
            <ChartHeader
              icon={HiOutlineChartBar}
              title="College Comparison Matrix"
              subtitle="Comparison of total users, students, teachers, and active 30-day members"
            />
            <div className="w-full min-w-0 text-fg-faint" style={{ height: compareHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={colleges} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} horizontal={false} />
                  <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    width={96}
                    tickFormatter={shortName}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={BAR_CURSOR} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: 'var(--fg-muted)' }} />
                  <Bar dataKey="students" fill="var(--chart-1)" name="Students" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="teachers" fill="var(--chart-3)" name="Teachers" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="activeUsers" fill="var(--chart-4)" name="Active (30d)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid-cards">
            {colleges.map((c) => (
              <div key={c._id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-fg" title={c.name}>{c.name}</p>
                    <span className="font-mono text-[11px] font-semibold text-accent">{c.code}</span>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                    <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="badge badge-primary uppercase">{c.plan}</span>
                  </div>
                </div>

                <hr className="divider" />

                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Users', val: c.users },
                    { label: 'Students', val: c.students },
                    { label: 'Teachers', val: c.teachers },
                    { label: 'Active', val: c.activeUsers },
                  ].map((s) => (
                    <div key={s.label} className="min-w-0 rounded-xl bg-card-2 p-2">
                      <p className="text-base font-bold tabular-nums text-fg">{s.val}</p>
                      <p className="truncate text-[10px] font-medium text-fg-muted">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: LOGIN TRENDS ── */}
      {tab === 'logins' && logins && (
        <div
          className="page"
          role="tabpanel"
          id="analytics-panel-logins"
          aria-labelledby="analytics-tab-logins"
        >
          <div className="split split-even">
            {/* Most active colleges */}
            <div className="card">
              <ChartHeader
                icon={HiOutlineStar}
                title="Most Active Colleges"
                subtitle="Ranked by total login volume (last 30 days)"
              />
              <div className="h-[280px] w-full min-w-0 text-fg-faint sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={logins.topColleges || []} margin={{ top: 4, right: 4, left: 0, bottom: 40 }}>
                    <CartesianGrid {...GRID_PROPS} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={AXIS_TICK}
                      tickFormatter={shortName}
                      axisLine={false}
                      tickLine={false}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis width={32} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={BAR_CURSOR} />
                    <Bar dataKey="logins" radius={[4, 4, 0, 0]} name="Logins">
                      {(logins.topColleges || []).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Logins by role */}
            <div className="card">
              <ChartHeader
                icon={HiOutlineUserGroup}
                title="Logins by User Role"
                subtitle="Daily activity breakdown per user role type"
              />
              {(() => {
                // Group loginsByRole into day objects
                const dayMap = {};
                (logins.loginsByRole || []).forEach((e) => {
                  if (!dayMap[e._id.day]) dayMap[e._id.day] = { day: e._id.day };
                  dayMap[e._id.day][e._id.role] = e.count;
                });
                const chartData = Object.values(dayMap).sort((a, b) => a.day.localeCompare(b.day));
                const roles = [...new Set((logins.loginsByRole || []).map((e) => e._id.role))];

                return (
                  <div className="h-[280px] w-full min-w-0 text-fg-faint sm:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid {...GRID_PROPS} vertical={false} />
                        <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={16} />
                        <YAxis width={32} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={BAR_CURSOR} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4, color: 'var(--fg-muted)' }} />
                        {roles.map((r, i) => (
                          <Bar key={r} dataKey={r} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} name={r} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SAAnalytics;