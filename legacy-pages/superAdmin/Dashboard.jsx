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
      <div className="bg-white dark:bg-[#131920] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-xl text-xs">
        <p className="font-semibold text-slate-600 dark:text-white/70 mb-1">{label}</p>
        <p className="font-bold text-indigo-600 dark:text-indigo-400">
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
      <div className="flex items-center justify-center min-h-[300px] w-full">
        <div className="w-9 h-9 border-3 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const s = data?.stats || {};
  const plans = data?.planDistribution || {};

  const cards = [
    { 
      label: 'Total Colleges',  
      value: s.totalColleges || 0,   
      icon: HiOutlineOfficeBuilding, 
      color: 'text-indigo-600 dark:text-indigo-400', 
      bg: 'bg-indigo-50 dark:bg-indigo-500/12 border-indigo-100 dark:border-indigo-500/20' 
    },
    { 
      label: 'Active Colleges', 
      value: s.activeColleges || 0,  
      icon: HiOutlineShieldCheck,   
      color: 'text-emerald-600 dark:text-emerald-400', 
      bg: 'bg-emerald-50 dark:bg-emerald-500/12 border-emerald-100 dark:border-emerald-500/20' 
    },
    { 
      label: 'Total Users',     
      value: s.totalUsers || 0,      
      icon: HiOutlineUserGroup,     
      color: 'text-sky-600 dark:text-sky-400', 
      bg: 'bg-sky-50 dark:bg-sky-500/12 border-sky-100 dark:border-sky-500/20' 
    },
    { 
      label: 'Total Students',  
      value: s.totalStudents || 0,   
      icon: HiOutlineAcademicCap,   
      color: 'text-amber-600 dark:text-amber-400', 
      bg: 'bg-amber-50 dark:bg-amber-500/12 border-amber-100 dark:border-amber-500/20' 
    },
    { 
      label: 'Suspended',       
      value: s.suspendedColleges || 0, 
      icon: HiOutlineExclamation,   
      color: 'text-rose-600 dark:text-rose-400', 
      bg: 'bg-rose-50 dark:bg-rose-500/12 border-rose-100 dark:border-rose-500/20' 
    },
    { 
      label: 'Growth',          
      value: '+12%',                  
      icon: HiOutlineTrendingUp,    
      color: 'text-purple-600 dark:text-purple-400', 
      bg: 'bg-purple-50 dark:bg-purple-500/12 border-purple-100 dark:border-purple-500/20' 
    },
  ];

  const totalForPct = s.totalColleges || 1;
  const planData = [
    { name: 'Basic',      count: plans.basic || 0,      color: '#60a5fa' },
    { name: 'Premium',    count: plans.premium || 0,    color: '#818cf8' },
    { name: 'Enterprise', count: plans.enterprise || 0, color: '#fbbf24' },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6 w-full max-w-full pb-8">

      {/* ── 1. Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Super Admin
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-white/50 mt-1 font-medium">
            Global platform overview across all colleges
          </p>
        </div>

        <button 
          onClick={() => navigate('/super-admin/colleges')} 
          className="btn-primary self-start sm:self-auto px-5 py-2.5 shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold active:scale-98 transition-all"
        >
          <HiOutlineOfficeBuilding size={18} />
          <span>Manage Colleges</span>
        </button>
      </div>

      {/* ── 2. Stat Cards Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 w-full">
        {cards.map((c, i) => {
          const IconComp = c.icon;
          return (
            <div 
              key={i} 
              className="glass-card p-4 sm:p-5 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-xs dark:shadow-none flex flex-col justify-between gap-3 hover:border-indigo-500/30 transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-white/45 uppercase tracking-wider truncate">
                  {c.label}
                </span>
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${c.bg} border flex items-center justify-center shrink-0`}>
                  <IconComp className={`text-base sm:text-lg ${c.color}`} />
                </div>
              </div>

              <div className="mt-1">
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                  {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. Middle Section: Subscription Plans & Recent Colleges ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 w-full">

        {/* Subscription Plans Card */}
        <div className="glass-card p-5 sm:p-6 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-xs dark:shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.04]">
              <HiOutlineChartBar size={18} className="text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Subscription Plans
              </h3>
            </div>

            <div className="space-y-4">
              {planData.map((p) => {
                const pct = Math.round((p.count / totalForPct) * 100);
                return (
                  <div key={p.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-white/80 font-bold">{p.name}</span>
                      <span className="text-slate-500 dark:text-white/50">{p.count} colleges ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: p.color }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Colleges Card */}
        <div className="glass-card p-5 sm:p-6 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-xs dark:shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.04]">
              <div className="flex items-center gap-2">
                <HiOutlineOfficeBuilding size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Recent Colleges
                </h3>
              </div>
              <button 
                onClick={() => navigate('/super-admin/colleges')} 
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <HiOutlineArrowRight size={13} />
              </button>
            </div>

            {(data?.recentColleges || []).length === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-white/40 text-xs">
                No colleges registered yet
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.recentColleges.map((c) => (
                  <div 
                    key={c._id} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center shrink-0 uppercase">
                      {c.code?.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-white/40 font-medium">
                        {c.code} · {c.totalStudents || 0} students
                      </p>
                    </div>
                    <span 
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize shrink-0 ${
                        c.subscription?.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20' 
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20'
                      }`}
                    >
                      {c.subscription?.status || 'inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── 4. Charts Row ────────────────────────────────────────────── */}
      {(analytics?.monthlyRegistrations?.length > 0 || analytics?.dailyLogins?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 w-full">
          {analytics?.monthlyRegistrations?.length > 0 && (
            <div className="glass-card p-5 sm:p-6 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-xs dark:shadow-none">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📈</span> User Growth (12 months)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={analytics.monthlyRegistrations}>
                  <defs>
                    <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="url(#gU)" name="Users" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {analytics?.dailyLogins?.length > 0 && (
            <div className="glass-card p-5 sm:p-6 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-xs dark:shadow-none">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🔑</span> Daily Logins (30 days)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.dailyLogins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Logins" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── 5. Recent Activity Section ───────────────────────────────── */}
      <div className="w-full">
        <RecentActivityWidget role="super-admin" />
      </div>

    </div>
  );
};

export default SuperAdminDashboard;
