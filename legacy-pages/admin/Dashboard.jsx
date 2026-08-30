import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import RecentActivityWidget from '../../components/activity/RecentActivityWidget';
import {
  HiOutlineAcademicCap, 
  HiOutlineUserGroup, 
  HiOutlineClipboardCheck,
  HiOutlineCurrencyDollar, 
  HiOutlineChartBar, 
  HiOutlineArrowRight,
  HiOutlineSpeakerphone, 
  HiOutlineCalendar, 
  HiOutlineShieldCheck,
  HiOutlineExclamation
} from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#0f1721] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-xl text-xs">
        <p className="font-semibold text-slate-600 dark:text-white/70 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="font-bold text-slate-800 dark:text-white flex items-center justify-between gap-3">
            <span style={{ color: entry.fill || entry.color }}>{entry.name}:</span>
            <span>{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
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
    day: 'numeric' 
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px] w-full">
        <div className="w-9 h-9 border-3 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const s = data?.stats || {};
  const attendMap = {};
  (data?.attendanceToday || []).forEach(a => { attendMap[a._id] = a.count; });
  const totalPresent = attendMap.present || 0;
  const totalAbsent = attendMap.absent || 0;
  const totalLate = attendMap.late || 0;
  const totalLeave = attendMap.leave || 0;
  const totalMarked = totalPresent + totalAbsent + totalLate + totalLeave;
  const attPct = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  const statCards = [
    { 
      label: 'Total Students', 
      value: s.totalStudents || 0, 
      icon: HiOutlineAcademicCap, 
      color: 'text-indigo-600 dark:text-indigo-400', 
      bg: 'bg-indigo-50 dark:bg-indigo-500/12 border-indigo-100 dark:border-indigo-500/20', 
      link: '/admin/students' 
    },
    { 
      label: 'Active Students', 
      value: s.activeStudents || 0, 
      icon: HiOutlineAcademicCap, 
      color: 'text-emerald-600 dark:text-emerald-400', 
      bg: 'bg-emerald-50 dark:bg-emerald-500/12 border-emerald-100 dark:border-emerald-500/20', 
      link: '/admin/students' 
    },
    { 
      label: 'Total Teachers', 
      value: s.totalTeachers || 0, 
      icon: HiOutlineUserGroup, 
      color: 'text-sky-600 dark:text-sky-400', 
      bg: 'bg-sky-50 dark:bg-sky-500/12 border-sky-100 dark:border-sky-500/20', 
      link: '/admin/staff' 
    },
    { 
      label: 'Employees & Staff', 
      value: s.totalEmployees || 0, 
      icon: HiOutlineUserGroup, 
      color: 'text-amber-600 dark:text-amber-400', 
      bg: 'bg-amber-50 dark:bg-amber-500/12 border-amber-100 dark:border-amber-500/20', 
      link: '/admin/staff' 
    },
  ];

  // Prepare Recharts dataset for Attendance Overview
  const attendanceChartData = [
    { status: 'Present', count: totalPresent, fill: '#10b981' },
    { status: 'Absent',  count: totalAbsent,  fill: '#f43f5e' },
    { status: 'Late',    count: totalLate,    fill: '#f59e0b' },
    { status: 'Leave',   count: totalLeave,   fill: '#0284c7' },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6 w-full max-w-full pb-8">

      {/* ── 1. Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            {data?.college && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/20">
                {data.college.name} ({data.college.code}) · <span className="capitalize">{data.college.subscription?.plan || 'Standard'}</span> Plan
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/50 font-medium">
            <HiOutlineCalendar size={14} className="text-indigo-500" />
            <span>{today}</span>
          </div>
        </div>

        <button 
          onClick={() => navigate('/admin/students')} 
          className="btn-primary self-start sm:self-auto px-5 py-2.5 shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold active:scale-98 transition-all"
        >
          <HiOutlineAcademicCap size={18} />
          <span>Manage Students</span>
        </button>
      </div>

      {/* ── 2. Stat Cards Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {statCards.map((c, i) => {
          const IconComp = c.icon;
          return (
            <div 
              key={i} 
              onClick={() => navigate(c.link)}
              className="glass-card p-4 sm:p-5 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-xs dark:shadow-none flex flex-col justify-between gap-3 hover:border-indigo-500/30 hover:-translate-y-0.5 cursor-pointer transition-all duration-200"
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

      {/* ── 3. Operations Overview Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 w-full">

        {/* Today's Attendance Card */}
        <div className="glass-card p-5 sm:p-6 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-xs dark:shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/12 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <HiOutlineClipboardCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    Today's Attendance
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-white/40 font-medium">
                    {totalMarked > 0 ? `${attPct}% total presence rate` : 'Attendance pending for today'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/admin/attendance')} 
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <span>Mark now</span>
                <HiOutlineArrowRight size={13} />
              </button>
            </div>

            {/* Attendance Progress Bar */}
            {totalMarked > 0 && (
              <div className="h-2.5 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${attPct}%` }}
                />
              </div>
            )}

            {/* Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'Present', count: totalPresent, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/12 border-emerald-100 dark:border-emerald-500/20' },
                { label: 'Absent',  count: totalAbsent,  color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/12 border-rose-100 dark:border-rose-500/20' },
                { label: 'Late',    count: totalLate,    color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/12 border-amber-100 dark:border-amber-500/20' },
                { label: 'Leave',   count: totalLeave,   color: 'text-sky-700 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/12 border-sky-100 dark:border-sky-500/20' },
              ].map(a => (
                <div key={a.label} className={`p-3 rounded-xl ${a.bg} border text-center flex flex-col justify-center`}>
                  <p className={`text-xl font-black ${a.color} leading-none`}>{a.count}</p>
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-white/60 mt-1">{a.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fee Overview Card */}
        <div className="glass-card p-5 sm:p-6 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-xs dark:shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/12 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <HiOutlineCurrencyDollar size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    Fee Collection Status
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-white/40 font-medium">
                    Current billing cycle overview
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/admin/fees')} 
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <span>View details</span>
                <HiOutlineArrowRight size={13} />
              </button>
            </div>

            {(data?.feeStats || []).length === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-white/40 text-xs">
                No fee records found for current cycle
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.feeStats.map(f => {
                  const statusColors = {
                    paid: 'bg-emerald-500',
                    partial: 'bg-amber-500',
                    unpaid: 'bg-rose-500'
                  };
                  const statusText = {
                    paid: 'text-emerald-700 dark:text-emerald-400',
                    partial: 'text-amber-700 dark:text-amber-400',
                    unpaid: 'text-rose-700 dark:text-rose-400'
                  };
                  return (
                    <div 
                      key={f._id} 
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${statusColors[f._id] || 'bg-slate-400'} shrink-0`} />
                        <span className={`text-xs font-extrabold capitalize ${statusText[f._id] || 'text-slate-700'}`}>
                          {f._id}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-white/40">
                          ({f.count} students)
                        </span>
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        Rs. {(f.total || 0).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── 4. Security & Quick Actions Row ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 w-full">

        {/* Gate Security & Visitor Operations */}
        <div className="glass-card p-5 sm:p-6 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-xs dark:shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-500/12 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                  <HiOutlineShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    Gate & Campus Security
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-white/40 font-medium">
                    Real-time campus entries and visitor records
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/admin/visitors')} 
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <span>Logs</span>
                <HiOutlineArrowRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Students Inside', count: s.currentlyInsideStudents || 0, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/12 border-indigo-100 dark:border-indigo-500/20', sub: "Active on campus" },
                { label: 'Staff Inside',    count: s.currentlyInsideStaff || 0,    color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/12 border-sky-100 dark:border-sky-500/20', sub: "Faculty & personnel" },
                { label: 'Entries / Exits', count: `${s.todayEntries || 0} / ${s.todayExits || 0}`, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/12 border-emerald-100 dark:border-emerald-500/20', sub: "Total scanned today" },
                { label: 'Visitors Logged', count: s.todayVisitors || 0,           color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/12 border-amber-100 dark:border-amber-500/20', sub: "Guest registrations" },
              ].map((item, idx) => (
                <div key={idx} className={`p-3 sm:p-3.5 rounded-xl ${item.bg} border flex flex-col justify-center`}>
                  <p className={`text-lg sm:text-xl font-black ${item.color} leading-none`}>{item.count}</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-white mt-1">{item.label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-white/40 font-medium mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Administrative Actions Hub */}
        <div className="glass-card p-5 sm:p-6 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-xs dark:shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.04]">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/12 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <HiOutlineChartBar size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Quick Administrative Actions
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-white/40 font-medium">
                  Frequently accessed workflows & portals
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { label: 'Add New Student',    icon: HiOutlineAcademicCap,    path: '/admin/students',        color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/12' },
                { label: 'Mark Attendance',    icon: HiOutlineClipboardCheck,  path: '/admin/attendance',      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/12' },
                { label: 'Enter Results',      icon: HiOutlineChartBar,        path: '/admin/results/entry',   color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/12' },
                { label: 'Post Announcement', icon: HiOutlineSpeakerphone,    path: '/admin/announcements',   color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/12' },
                { label: 'Fee Defaulters',     icon: HiOutlineExclamation,     path: '/admin/fees/defaulters', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/12' },
              ].map(a => {
                const Icon = a.icon;
                return (
                  <button 
                    key={a.path} 
                    onClick={() => navigate(a.path)} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all text-left group"
                  >
                    <div className={`w-8 h-8 rounded-lg ${a.bg} flex items-center justify-center ${a.color} shrink-0`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white/90 flex-1 truncate">
                      {a.label}
                    </span>
                    <HiOutlineArrowRight size={14} className="text-slate-400 dark:text-white/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ── 5. Analytics Chart Row ────────────────────────────────────── */}
      {totalMarked > 0 && (
        <div className="w-full">
          <div className="glass-card p-5 sm:p-6 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-xs dark:shadow-none">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span>📊</span> Today's Attendance Distribution Visualizer
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── 6. Recent Activity Section ───────────────────────────────── */}
      <div className="w-full">
        <RecentActivityWidget role="admin" />
      </div>

    </div>
  );
};

export default AdminDashboard;

