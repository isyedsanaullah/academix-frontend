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

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6'];

const PLAN_COLORS = {
  basic: '#94a3b8',
  standard: '#3b82f6',
  premium: '#8b5cf6',
  enterprise: '#f59e0b'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#131920] border border-slate-200 dark:border-white/10 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[140px]">
      {label && (
        <p className="font-bold text-slate-800 dark:text-white/90 border-b border-slate-100 dark:border-white/[0.06] pb-1 mb-1">
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-white/70">
            <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: p.color || p.fill }} />
            {p.name || p.dataKey}:
          </span>
          <span className="font-extrabold text-slate-900 dark:text-white font-mono">
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const ChartHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
      {Icon ? <Icon size={18} /> : <HiOutlineChartBar size={18} />}
    </div>
    <div className="min-w-0">
      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight truncate">
        {title}
      </h3>
      {subtitle && (
        <p className="text-[11px] text-slate-500 dark:text-white/40 font-medium mt-0.5 truncate">
          {subtitle}
        </p>
      )}
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
      <div className="flex flex-col items-center justify-center min-h-[360px] text-slate-400 dark:text-white/40">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium">Aggregating platform telemetry and metrics...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Platform Overview', icon: HiOutlineChartBar },
    { id: 'colleges', label: 'College-wise Comparison', icon: HiOutlineOfficeBuilding },
    { id: 'logins', label: 'Login Trends & Activity', icon: HiOutlineKey },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#0d1117] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold shrink-0">
            <HiOutlineChartBar size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Platform Analytics & Insights
            </h1>
            <p className="text-slate-500 dark:text-white/40 text-xs sm:text-sm mt-0.5">
              Real-time intelligence on college adoption, user growth, and active usage
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnalyticsData}
          className="btn-secondary self-start sm:self-center py-2 px-3.5 text-xs inline-flex items-center gap-1.5"
          title="Refresh analytics data"
        >
          <HiOutlineRefresh size={15} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Top Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {[
          { label: 'Total Colleges', value: overview?.totals?.colleges, color: 'text-indigo-600 dark:text-indigo-400', icon: HiOutlineOfficeBuilding, bg: 'bg-indigo-500/10 border-indigo-500/15' },
          { label: 'Active Colleges', value: overview?.totals?.activeColleges, color: 'text-emerald-600 dark:text-emerald-400', icon: HiOutlineCheckCircle, bg: 'bg-emerald-500/10 border-emerald-500/15' },
          { label: 'Total Users', value: overview?.totals?.users, color: 'text-sky-600 dark:text-sky-400', icon: HiOutlineUserGroup, bg: 'bg-sky-500/10 border-sky-500/15' },
          { label: 'Students', value: overview?.totals?.students, color: 'text-violet-600 dark:text-violet-400', icon: HiOutlineAcademicCap, bg: 'bg-violet-500/10 border-violet-500/15' },
          { label: 'Teachers', value: overview?.totals?.teachers, color: 'text-amber-600 dark:text-amber-400', icon: HiOutlineBookOpen, bg: 'bg-amber-500/10 border-amber-500/15' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  {s.label}
                </p>
                <p className={`text-2xl font-black mt-1 ${s.color}`}>
                  {s.value != null ? s.value.toLocaleString() : '—'}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${s.bg} ${s.color}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Visually Polished Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-3 overflow-x-auto">
        {tabs.map(t => {
          const TabIcon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                tab === t.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              <TabIcon size={16} className="shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Row 1: Registrations Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* User Registrations Area Chart */}
            <div className="glass-card p-5">
              <ChartHeader
                icon={HiOutlineTrendingUp}
                title="User Registrations"
                subtitle="Monthly user onboarding trend (last 12 months)"
              />
              <div className="w-full h-[260px] sm:h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview?.monthlyRegistrations || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-white/[0.06]" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradUsers)" name="Registered Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* College Registrations Bar Chart */}
            <div className="glass-card p-5">
              <ChartHeader
                icon={HiOutlineOfficeBuilding}
                title="College Registrations"
                subtitle="Monthly workspace onboardings"
              />
              <div className="w-full h-[260px] sm:h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview?.monthlyColleges || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-white/[0.06]" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} name="Colleges" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: Distribution Pie Charts & Active Users */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Role Breakdown Pie Chart */}
            <div className="glass-card p-5">
              <ChartHeader
                icon={HiOutlineUserGroup}
                title="Users by Role"
                subtitle="Platform-wide distribution"
              />
              <div className="w-full h-[220px]">
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
                  <div key={item.role} className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="capitalize text-slate-600 dark:text-white/70 truncate">{item.role}:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Plans Breakdown Pie Chart */}
            <div className="glass-card p-5">
              <ChartHeader
                icon={HiOutlineSparkles}
                title="Subscription Plans"
                subtitle="College subscription tiers"
              />
              <div className="w-full h-[220px]">
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
                    >
                      {(overview?.planBreakdown || []).map((entry, i) => (
                        <Cell key={i} fill={PLAN_COLORS[entry.plan?.toLowerCase()] || CHART_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                {(overview?.planBreakdown || []).map((entry, i) => (
                  <div key={entry.plan} className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PLAN_COLORS[entry.plan?.toLowerCase()] || CHART_COLORS[i] }} />
                    <span className="capitalize text-slate-600 dark:text-white/70 truncate">{entry.plan}:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Active Logins */}
            <div className="glass-card p-5">
              <ChartHeader
                icon={HiOutlineKey}
                title="Daily Active Users"
                subtitle="Last 30 days login activity"
              />
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview?.dailyLogins || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradLogins" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-white/[0.06]" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2.5} fill="url(#gradLogins)" name="Active Logins" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COLLEGE-WISE COMPARISON */}
      {tab === 'colleges' && (
        <div className="space-y-5">
          {/* Comparison Bar Chart */}
          <div className="glass-card p-5">
            <ChartHeader
              icon={HiOutlineChartBar}
              title="College Comparison Matrix"
              subtitle="Comparison of total users, students, teachers, and active 30-day members"
            />
            <div className="w-full h-[320px] sm:h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={colleges} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-white/[0.06]" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} width={130} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="students" fill="#6366f1" name="Students" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="teachers" fill="#10b981" name="Teachers" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="activeUsers" fill="#f59e0b" name="Active (30d)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Individual College Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {colleges.map(c => (
              <div key={c._id} className="glass-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3">
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 dark:text-white text-base truncate">
                      {c.name}
                    </p>
                    <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                      {c.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      c.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                    }`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20">
                      {c.plan}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Users', val: c.users, color: 'text-indigo-600 dark:text-indigo-400' },
                    { label: 'Students', val: c.students, color: 'text-violet-600 dark:text-violet-400' },
                    { label: 'Teachers', val: c.teachers, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Active', val: c.activeUsers, color: 'text-amber-600 dark:text-amber-400' },
                  ].map(s => (
                    <div key={s.label} className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                      <p className={`text-base font-extrabold ${s.color}`}>{s.val}</p>
                      <p className="text-[10px] text-slate-500 dark:text-white/40 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LOGIN TRENDS */}
      {tab === 'logins' && logins && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Active Colleges */}
            <div className="glass-card p-5">
              <ChartHeader
                icon={HiOutlineStar}
                title="Most Active Colleges"
                subtitle="Ranked by total login volume (last 30 days)"
              />
              <div className="w-full h-[280px] sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={logins.topColleges || []} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-white/[0.06]" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="logins" radius={[6, 6, 0, 0]} name="Logins">
                      {(logins.topColleges || []).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Logins by Role Breakdown */}
            <div className="glass-card p-5">
              <ChartHeader
                icon={HiOutlineUserGroup}
                title="Logins by User Role"
                subtitle="Daily activity breakdown per user role type"
              />
              {(() => {
                // Group loginsByRole into day objects
                const dayMap = {};
                (logins.loginsByRole || []).forEach(e => {
                  if (!dayMap[e._id.day]) dayMap[e._id.day] = { day: e._id.day };
                  dayMap[e._id.day][e._id.role] = e.count;
                });
                const chartData = Object.values(dayMap).sort((a, b) => a.day.localeCompare(b.day));
                const roles = [...new Set((logins.loginsByRole || []).map(e => e._id.role))];

                return (
                  <div className="w-full h-[280px] sm:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-white/[0.06]" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 5 }} />
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
