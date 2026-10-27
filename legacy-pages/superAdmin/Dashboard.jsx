import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineTrendingUp,
  HiOutlineArrowRight,
  HiOutlineChartBar
} from 'react-icons/hi';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import RecentActivityWidget from '../../components/activity/RecentActivityWidget';

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-line bg-card p-2.5 text-xs shadow-lg">
        <p className="mb-1 font-semibold text-fg-muted">{label}</p>
        <p className="font-bold tabular-nums text-accent">
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
    const fetch = async () => {
      try {
        const [dash, ov] = await Promise.all([
          api.get('/super-admin/dashboard'),
          api.get('/analytics/overview').catch(() => ({ data: { data: null } }))
        ]);
        setData(dash.data.data);
        setAnalytics(ov.data.data);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="page" aria-busy="true">
        <div className="page-head">
          <div className="min-w-0 flex-1">
            <div className="skeleton h-7 w-56 max-w-full" />
            <div className="skeleton mt-2 h-4 w-72 max-w-full" />
          </div>
          <div className="skeleton h-10 w-40" />
        </div>
        <div className="stat-grid stat-grid-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-[88px]" />
          ))}
        </div>
        <div className="split split-even">
          <div className="skeleton h-[220px]" />
          <div className="skeleton h-[220px]" />
        </div>
      </div>
    );
  }

  const s = data?.stats || {};
  const plans = data?.planDistribution || {};
  const recentColleges = data?.recentColleges || [];

  const totalForPct = s.totalColleges || 1;
  // Derived from existing numbers only: share of colleges that are active.
  const activeShare = s.totalColleges ? Math.round(((s.activeColleges || 0) / s.totalColleges) * 100) : 0;

  const cards = [
    { label: 'Total Colleges', value: s.totalColleges || 0, icon: HiOutlineOfficeBuilding, tone: '' },
    { label: 'Active Colleges', value: s.activeColleges || 0, icon: HiOutlineShieldCheck, tone: 'text-ok' },
    { label: 'Total Users', value: s.totalUsers || 0, icon: HiOutlineUserGroup, tone: '' },
    { label: 'Total Students', value: s.totalStudents || 0, icon: HiOutlineAcademicCap, tone: '' },
    {
      label: 'Suspended',
      value: s.suspendedColleges || 0,
      icon: HiOutlineExclamation,
      tone: (s.suspendedColleges || 0) > 0 ? 'text-bad' : ''
    },
    { label: 'Active Share', value: `${activeShare}%`, icon: HiOutlineTrendingUp, tone: '' },
  ];

  const planData = [
    { name: 'Basic', count: plans.basic || 0, color: 'var(--chart-2)' },
    { name: 'Premium', count: plans.premium || 0, color: 'var(--chart-3)' },
    { name: 'Enterprise', count: plans.enterprise || 0, color: 'var(--chart-1)' },
  ];

  const hasGrowth = analytics?.monthlyRegistrations?.length > 0;
  const hasLogins = analytics?.dailyLogins?.length > 0;

  return (
    <div className="page">

      {/* ── 1. Page header ───────────────────────────────────────────── */}
      <div className="page-head">
        <div className="min-w-0">
          <h1 className="page-title">Super Admin Overview</h1>
          <p className="page-sub">Global operational overview across all registered colleges</p>
        </div>
        <div className="page-actions">
          <button type="button" onClick={() => navigate('/super-admin/colleges')} className="btn-primary">
            <HiOutlineOfficeBuilding size={18} aria-hidden="true" />
            <span>Manage Colleges</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI strip ─────────────────────────────────────────────── */}
      <div className="stat-grid stat-grid-3">
        {cards.map((c) => {
          const IconComp = c.icon;
          return (
            <div key={c.label} className="stat-card">
              <div className="stat-top">
                <span className="stat-label truncate">{c.label}</span>
                <span className="stat-icon">
                  <IconComp size={18} aria-hidden="true" />
                </span>
              </div>
              <div className={`stat-value tabular-nums ${c.tone}`}>
                {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. Subscription plans & recent colleges ──────────────────── */}
      <div className="split split-even">

        {/* Subscription tier distribution */}
        <div className="card min-w-0">
          <div className="card-head">
            <div className="card-title flex min-w-0 items-center gap-2">
              <HiOutlineChartBar size={18} className="shrink-0 text-accent" aria-hidden="true" />
              <span className="truncate">Subscription Tier Distribution</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {planData.map((p) => {
              const pct = Math.round((p.count / totalForPct) * 100);
              return (
                <div key={p.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2 font-semibold text-fg">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: p.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-fg-muted">
                      {p.count} colleges ({pct}%)
                    </span>
                  </div>
                  <div className="progress" role="img" aria-label={`${p.name}: ${pct}%`}>
                    <i style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recently onboarded colleges */}
        <div className="card min-w-0">
          <div className="card-head">
            <div className="card-title flex min-w-0 items-center gap-2">
              <HiOutlineOfficeBuilding size={18} className="shrink-0 text-accent" aria-hidden="true" />
              <span className="truncate">Recently Onboarded Colleges</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/super-admin/colleges')}
              className="btn-ghost btn-sm shrink-0"
            >
              <span>View all</span>
              <HiOutlineArrowRight size={14} aria-hidden="true" />
            </button>
          </div>

          {recentColleges.length === 0 ? (
            <div className="empty">No colleges registered yet</div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentColleges.map((c) => (
                <div key={c._id} className="flex items-center gap-2.5 rounded-xl bg-card-2 p-2.5">
                  <div className="avatar shrink-0 uppercase" aria-hidden="true">
                    {c.code?.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg" title={c.name}>
                      {c.name}
                    </p>
                    <p className="truncate text-xs tabular-nums text-fg-muted">
                      {c.code} · {c.totalStudents || 0} students
                    </p>
                  </div>
                  <span
                    className={`badge shrink-0 capitalize ${c.subscription?.status === 'active' ? 'badge-success' : 'badge-danger'}`}
                  >
                    {c.subscription?.status || 'inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── 4. Charts ────────────────────────────────────────────────── */}
      {(hasGrowth || hasLogins) && (
        <div className="split split-even">
          {hasGrowth && (
            <div className="card min-w-0">
              <div className="card-head">
                <div className="card-title flex min-w-0 items-center gap-2">
                  <HiOutlineTrendingUp size={18} className="shrink-0 text-accent" aria-hidden="true" />
                  <span className="truncate">User Growth (12 months)</span>
                </div>
              </div>
              <div className="min-w-0 text-fg-faint">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={analytics.monthlyRegistrations} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.2} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={16}
                    />
                    <YAxis
                      width={32}
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="var(--chart-1)"
                      strokeWidth={2.5}
                      fill="url(#gU)"
                      name="Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {hasLogins && (
            <div className="card min-w-0">
              <div className="card-head">
                <div className="card-title flex min-w-0 items-center gap-2">
                  <HiOutlineUserGroup size={18} className="shrink-0 text-accent" aria-hidden="true" />
                  <span className="truncate">Daily Logins (30 days)</span>
                </div>
              </div>
              <div className="min-w-0 text-fg-faint">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.dailyLogins} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.2} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={16}
                    />
                    <YAxis
                      width={32}
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.08 }} />
                    <Bar dataKey="count" fill="var(--chart-3)" radius={[4, 4, 0, 0]} name="Logins" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 5. Recent activity ───────────────────────────────────────── */}
      <RecentActivityWidget role="super-admin" />

    </div>
  );
};

export default SuperAdminDashboard;