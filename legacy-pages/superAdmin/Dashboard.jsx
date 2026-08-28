import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineOfficeBuilding, HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineShieldCheck, HiOutlineExclamation, HiOutlineTrendingUp, HiOutlineArrowRight } from 'react-icons/hi';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import RecentActivityWidget from '../../components/activity/RecentActivityWidget';

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
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'240px' }}>
      <div style={{ width:'32px', height:'32px', border:'2px solid rgba(99,102,241,0.2)', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
    </div>
  );

  const s = data?.stats || {};
  const plans = data?.planDistribution || {};

  const cards = [
    { label:'Total Colleges',  value: s.totalColleges || 0,   icon: HiOutlineOfficeBuilding, color:'#818cf8', bg:'rgba(99,102,241,0.12)' },
    { label:'Active Colleges', value: s.activeColleges || 0,  icon: HiOutlineShieldCheck,   color:'#4ade80', bg:'rgba(34,197,94,0.10)' },
    { label:'Total Users',     value: s.totalUsers || 0,      icon: HiOutlineUserGroup,     color:'#60a5fa', bg:'rgba(56,189,248,0.10)' },
    { label:'Total Students',  value: s.totalStudents || 0,   icon: HiOutlineAcademicCap,   color:'#fbbf24', bg:'rgba(251,191,36,0.10)' },
    { label:'Suspended',       value: s.suspendedColleges||0, icon: HiOutlineExclamation,   color:'#f87171', bg:'rgba(248,113,113,0.10)' },
    { label:'Growth',          value: '+12%',                  icon: HiOutlineTrendingUp,    color:'#a78bfa', bg:'rgba(167,139,250,0.10)' },
  ];

  const totalForPct = s.totalColleges || 1;
  const planData = [
    { name:'Basic',      count: plans.basic || 0,      color:'#60a5fa' },
    { name:'Premium',    count: plans.premium || 0,    color:'#818cf8' },
    { name:'Enterprise', count: plans.enterprise || 0, color:'#fbbf24' },
  ];

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'24px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>Super Admin</h1>
          <p style={{ fontSize:'12px', color:'var(--text-tertiary)', marginTop:'4px' }}>Global platform overview across all colleges</p>
        </div>
        <button onClick={() => navigate('/super-admin/colleges')} className="btn-primary" style={{ fontSize:'12px', padding:'8px 14px' }}>
          <HiOutlineOfficeBuilding size={15} /> Manage Colleges
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'12px' }}>
        {cards.map((c, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'16px 18px', background:'var(--color-surface)',
            border:'1px solid var(--color-border)', borderRadius:'14px',
          }}>
            <div>
              <p style={{ fontSize:'10px', fontWeight:600, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.07em' }}>{c.label}</p>
              <p style={{ fontSize:'26px', fontWeight:800, color:'var(--text-primary)', lineHeight:1, marginTop:'6px' }}>{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</p>
            </div>
            <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <c.icon size={20} style={{ color: c.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Lower Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'16px' }}>

        {/* Plan Distribution */}
        <div className="glass-card" style={{ padding:'20px' }}>
          <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)', marginBottom:'16px' }}>Subscription Plans</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {planData.map(p => {
              const pct = Math.round((p.count / totalForPct) * 100);
              return (
                <div key={p.name}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                    <span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>{p.name}</span>
                    <span style={{ fontSize:'12px', color:'var(--text-tertiary)' }}>{p.count} colleges ({pct}%)</span>
                  </div>
                  <div style={{ height:'5px', background:'var(--hover-bg)', borderRadius:'99px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:p.color, borderRadius:'99px', transition:'width 0.8s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Colleges */}
        <div className="glass-card" style={{ padding:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
            <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)' }}>Recent Colleges</p>
            <button onClick={() => navigate('/super-admin/colleges')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', display:'flex', alignItems:'center', gap:'3px', fontSize:'11px' }}>
              View all <HiOutlineArrowRight size={12} />
            </button>
          </div>
          {(data?.recentColleges || []).length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-tertiary)', fontSize:'13px' }}>No colleges registered yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {data.recentColleges.map(c => (
                <div key={c._id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'10px', background:'var(--hover-bg)', border:'1px solid var(--border-color)' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#818cf8', fontWeight:700, fontSize:'11px', flexShrink:0 }}>
                    {c.code?.slice(0,2)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:'12px', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</p>
                    <p style={{ fontSize:'10px', color:'var(--text-tertiary)' }}>{c.code} · {c.totalStudents || 0} students</p>
                  </div>
                  <span style={{
                    fontSize:'10px', fontWeight:600, padding:'2px 8px', borderRadius:'99px',
                    background: c.subscription?.status==='active' ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)',
                    color: c.subscription?.status==='active' ? '#4ade80' : '#f87171',
                  }}>
                    {c.subscription?.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Charts Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(340px, 1fr))', gap:'16px' }}>
        {analytics?.monthlyRegistrations?.length > 0 && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color:'var(--text-primary)', marginBottom: '16px' }}>📈 User Growth (12 months)</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={analytics.monthlyRegistrations}>
                <defs>
                  <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2} fill="url(#gU)" name="Users" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {analytics?.dailyLogins?.length > 0 && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color:'var(--text-primary)', marginBottom: '16px' }}>🔑 Daily Logins (30 days)</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={analytics.dailyLogins}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="count" fill="#4ade80" radius={[4, 4, 0, 0]} name="Logins" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <RecentActivityWidget role="super-admin" />
    </div>
  );
};


export default SuperAdminDashboard;
