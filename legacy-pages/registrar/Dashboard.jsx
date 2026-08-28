import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiOutlineAcademicCap, HiOutlinePlus, HiOutlineCollection, HiOutlineCalendar, HiOutlineArrowRight, HiOutlineIdentification, HiOutlineClipboardCheck } from 'react-icons/hi';
import RecentActivityWidget from '../../components/activity/RecentActivityWidget';

const RegistrarDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const fetch = async () => {
      try {
        const [studRes] = await Promise.all([
          api.get('/students?limit=1'),
        ]);
        setStats({ totalStudents: studRes.data.pagination?.total || 0 });
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  const actions = [
    { label: 'Register Student',  icon: HiOutlinePlus,          path: '/registrar/students',    color: '#818cf8', desc: 'Add new admission' },
    { label: 'Manage Classes',    icon: HiOutlineCollection,    path: '/registrar/classes',     color: '#4ade80', desc: 'Classes & sections' },
    { label: 'Academic Sessions', icon: HiOutlineCalendar,      path: '/registrar/sessions',    color: '#60a5fa', desc: 'Manage sessions' },
    { label: 'View Attendance',   icon: HiOutlineClipboardCheck,path: '/registrar/attendance',  color: '#fbbf24', desc: 'Student attendance' },
    { label: 'Exam Schedule',     icon: HiOutlineIdentification,path: '/registrar/exams',       color: '#f87171', desc: 'Exams & schedule' },
    { label: 'Certificates',      icon: HiOutlineIdentification,path: '/registrar/certificates',color: '#a78bfa', desc: 'Issue certificates' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">Registrar · Student Management</span>
        </div>
        <button onClick={() => navigate('/registrar/students')} className="btn-primary text-xs px-3 py-2">
          <HiOutlinePlus size={15} /> Register Student
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Students', value: loading ? '—' : stats.totalStudents, icon: HiOutlineAcademicCap, color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
        ].map((c, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#0d1117] border border-white/[0.06]">
            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{c.label}</p>
              <p className="text-2xl font-extrabold text-white mt-1">{c.value}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.bg }}>
              <c.icon size={20} style={{ color: c.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] p-5">
        <p className="text-sm font-semibold text-white/70 mb-4">Registrar Tools</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {actions.map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10 transition text-left">
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
      <RecentActivityWidget role="registrar" />

      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-5 py-4">
        <p className="text-xs font-semibold text-emerald-400 mb-1">Registrar Access</p>
        <p className="text-xs text-white/40">You manage student registrations, admissions, classes, sessions, and academic schedules. Fee collection is handled by the Accountant.</p>
      </div>
    </div>
  );
};


export default RegistrarDashboard;
