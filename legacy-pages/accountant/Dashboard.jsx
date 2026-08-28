import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiOutlineCurrencyDollar, HiOutlineExclamation, HiOutlineArrowRight, HiOutlineChartBar, HiOutlineDocumentText, HiOutlineAcademicCap } from 'react-icons/hi';
import RecentAnnouncements from '../../components/common/RecentAnnouncements';
import RecentActivityWidget from '../../components/activity/RecentActivityWidget';


const AccountantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feeStats, setFeeStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/fees/stats');
        setFeeStats(data.data || []);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonth = feeStats.find(f => f._id === currentMonth) || {};
  const totalCollected = thisMonth.totalPaid || 0;
  const totalPending = (thisMonth.totalAmount || 0) - totalCollected;

  const actions = [
    { label: 'Fee Collection',  icon: HiOutlineCurrencyDollar, path: '/accountant/fees',            color: '#4ade80', desc: 'Collect & record fees' },
    { label: 'Fee Defaulters',  icon: HiOutlineExclamation,    path: '/accountant/fees/defaulters', color: '#f87171', desc: 'Overdue payments' },
    { label: 'Announcements',   icon: HiOutlineDocumentText,   path: '/accountant/announcements',   color: '#fbbf24', desc: 'View notices' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <span className="inline-block mt-2 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">Accountant · Finance Management</span>
        </div>
        <button onClick={() => navigate('/accountant/fees')} className="btn-primary text-xs px-3 py-2">
          <HiOutlineCurrencyDollar size={15} /> Collect Fee
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Collected (This Month)', value: `Rs. ${totalCollected.toLocaleString()}`, color: '#4ade80', bg: 'rgba(34,197,94,0.10)', icon: HiOutlineCurrencyDollar },
          { label: 'Pending (This Month)',   value: `Rs. ${totalPending.toLocaleString()}`,   color: '#f87171', bg: 'rgba(248,113,113,0.10)', icon: HiOutlineExclamation },
          { label: 'Paid Students',          value: thisMonth.paid || 0,                      color: '#818cf8', bg: 'rgba(99,102,241,0.12)', icon: HiOutlineAcademicCap },
        ].map((c, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#0d1117] border border-white/[0.06]">
            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{c.label}</p>
              <p className="text-lg font-extrabold text-white mt-1">{loading ? '—' : c.value}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.bg }}>
              <c.icon size={20} style={{ color: c.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Announcements */}
      <RecentAnnouncements />

      {/* Quick Actions */}
      <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] p-5">
        <p className="text-sm font-semibold text-white/70 mb-4">Finance Tools</p>
        <div className="grid grid-cols-2 gap-2">
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
      <RecentActivityWidget role="accountant" />

      <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-5 py-4">
        <p className="text-xs font-semibold text-amber-400 mb-1">Accountant Access</p>
        <p className="text-xs text-white/40">You manage all fee collection, payment records, and financial reports. Student registration is handled by the Registrar.</p>
      </div>
    </div>
  );
};


export default AccountantDashboard;
