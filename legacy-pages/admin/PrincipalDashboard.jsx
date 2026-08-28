import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineAcademicCap, HiOutlineClipboardCheck, HiOutlineChartBar,
  HiOutlineSpeakerphone, HiOutlineArrowRight, HiOutlineUserGroup,
  HiOutlineCurrencyDollar, HiOutlineCalendar, HiOutlineDocumentText, HiOutlineShieldCheck
} from 'react-icons/hi';
import RecentActivityWidget from '../../components/activity/RecentActivityWidget';

const PrincipalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data: res } = await api.get('/colleges/dashboard');
        setData(res.data);
      } catch { /* silently fail — stats are non-critical */ }
      finally { setLoading(false); }
    };
    loadDashboard();
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const quickActions = [
    { label: 'Students',       icon: HiOutlineAcademicCap,    path: '/principal/students',      color: '#818cf8', desc: 'View all students' },
    { label: 'Attendance',     icon: HiOutlineClipboardCheck, path: '/principal/attendance',     color: '#4ade80', desc: 'Check attendance records' },
    { label: 'Exam Results',   icon: HiOutlineChartBar,       path: '/principal/results',        color: '#60a5fa', desc: 'View result sheets' },
    { label: 'Examinations',   icon: HiOutlineDocumentText,   path: '/principal/exams',          color: '#fb923c', desc: 'Exam schedule' },
    { label: 'Fee Overview',   icon: HiOutlineCurrencyDollar, path: '/principal/fees',           color: '#f87171', desc: 'Fee collection status' },
    { label: 'Announcements',  icon: HiOutlineSpeakerphone,   path: '/principal/announcements',  color: '#fbbf24', desc: 'College notices' },
    { label: 'Staff',          icon: HiOutlineUserGroup,      path: '/principal/staff',          color: '#a78bfa', desc: 'View all staff accounts' },
  ];

  const s = data?.stats || {};

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <HiOutlineCalendar className="text-white/30" size={13} />
            <span className="text-xs text-white/30">{today}</span>
          </div>
          {user?.college && (
            <span className="inline-block mt-2 text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full">
              {user.college.name} &nbsp;·&nbsp; Principal
            </span>
          )}
        </div>
        <button onClick={() => navigate('/principal/students')} className="btn-primary text-xs px-3 py-2">
          <HiOutlineAcademicCap size={15} /> View Students
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* General Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Total Students',  value: s.totalStudents  ?? '—', icon: HiOutlineAcademicCap,    color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
              { label: 'Active Students', value: s.activeStudents ?? '—', icon: HiOutlineAcademicCap,    color: '#4ade80', bg: 'rgba(34,197,94,0.10)' },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#0d1117] border border-white/[0.06]">
                <div>
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{c.label}</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.bg }}>
                  <c.icon size={20} style={{ color: c.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Gate & Visitor Status */}
          <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <HiOutlineShieldCheck size={18} className="text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/70">Gate & Visitor Status</p>
                  <p className="text-[10px] text-white/30">Gate movements today</p>
                </div>
              </div>
              <span className="text-[10px] text-white/30">Read-Only View</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Students Inside', count: s.currentlyInsideStudents || 0, color: '#818cf8', bg: 'rgba(99,102,241,0.04)', desc: 'By today\'s scans' },
                { label: 'Staff Inside',    count: s.currentlyInsideStaff || 0,    color: '#fbbf24', bg: 'rgba(251,191,36,0.04)', desc: 'By today\'s scans' },
                { label: 'Entries / Exits', count: `${s.todayEntries || 0} / ${s.todayExits || 0}`, color: '#4ade80', bg: 'rgba(34,197,94,0.04)', desc: 'Gate logs' },
                { label: 'Visitors Logged', count: s.todayVisitors || 0,           color: '#60a5fa', bg: 'rgba(96,165,250,0.04)', desc: 'External visitors' },
              ].map((a, idx) => (
                <div key={idx} className="p-4 rounded-xl text-center border border-white/[0.02]" style={{ background: a.bg }}>
                  <p className="text-xl font-extrabold" style={{ color: a.color }}>{a.count}</p>
                  <p className="text-xs font-semibold text-white/60 mt-1.5">{a.label}</p>
                  <p className="text-[9px] text-white/30 mt-0.5">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Navigation */}
      <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] p-5">
        <p className="text-sm font-semibold text-white/70 mb-4">Quick Navigation</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {quickActions.map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.09] transition text-left">
              <a.icon size={18} style={{ color: a.color, flexShrink: 0 }} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white/70 truncate">{a.label}</p>
                <p className="text-[10px] text-white/30 truncate">{a.desc}</p>
              </div>
              <HiOutlineArrowRight size={12} className="text-white/20 ml-auto shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivityWidget role="principal" />

      {/* Access Level Notice */}
      <div className="rounded-xl bg-sky-500/5 border border-sky-500/20 px-5 py-4">
        <p className="text-xs font-semibold text-sky-400 mb-1">Principal Access Level</p>
        <p className="text-xs text-white/40">
          You have read-only access to all academic records — students, attendance, results, exams, and fee status.
          Account management and data modification require Admin, Registrar, or Accountant access.
        </p>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
