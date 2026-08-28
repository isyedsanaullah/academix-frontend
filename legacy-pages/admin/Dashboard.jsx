import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import RecentActivityWidget from '../../components/activity/RecentActivityWidget';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineAcademicCap, HiOutlineUserGroup, HiOutlineClipboardCheck,
  HiOutlineCurrencyDollar, HiOutlineChartBar, HiOutlineArrowRight,
  HiOutlineSpeakerphone, HiOutlineCalendar, HiOutlineShieldCheck
} from 'react-icons/hi';

const Spinner = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'240px' }}>
    <div style={{ width:'32px', height:'32px', border:'2px solid rgba(99,102,241,0.2)', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
  </div>
);

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
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    };
    fetchDashboard();
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  if (loading) return <Spinner />;

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
    { label: 'Total Students', value: s.totalStudents || 0, icon: HiOutlineAcademicCap, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', link: '/admin/students' },
    { label: 'Active Students', value: s.activeStudents || 0, icon: HiOutlineAcademicCap, color: '#22c55e', bg: 'rgba(34,197,94,0.10)', link: '/admin/students' },
    { label: 'Teachers', value: s.totalTeachers || 0, icon: HiOutlineUserGroup, color: '#38bdf8', bg: 'rgba(56,189,248,0.10)', link: '/admin/staff' },
    { label: 'Employees', value: s.totalEmployees || 0, icon: HiOutlineUserGroup, color: '#fb923c', bg: 'rgba(251,146,60,0.10)', link: '/admin/staff' },
  ];

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'24px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.02em', lineHeight:1.2 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'6px' }}>
            <HiOutlineCalendar style={{ color:'var(--text-tertiary)' }} size={13} />
            <span style={{ fontSize:'12px', color:'var(--text-tertiary)' }}>{today}</span>
          </div>
          {data?.college && (
            <span style={{ display:'inline-block', marginTop:'8px', fontSize:'11px', fontWeight:600, color:'#818cf8', background:'rgba(99,102,241,0.12)', padding:'3px 10px', borderRadius:'99px' }}>
              {data.college.name} ({data.college.code}) · {data.college.subscription?.plan} plan
            </span>
          )}
        </div>
        <button onClick={() => navigate('/admin/students')} className="btn-primary" style={{ fontSize:'12px', padding:'8px 14px' }}>
          <HiOutlineAcademicCap size={15} /> Manage Students
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'14px' }}>
        {statCards.map((c, i) => (
          <button key={i} onClick={() => navigate(c.link)} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'18px', background:'var(--color-surface)', border:'1px solid var(--color-border)',
            borderRadius:'14px', cursor:'pointer', transition:'border-color 0.15s, transform 0.1s',
            textAlign:'left',
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.10)'; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor='var(--color-border)'; e.currentTarget.style.transform='translateY(0)'; }}
          >
            <div>
              <p style={{ fontSize:'11px', fontWeight:600, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{c.label}</p>
              <p style={{ fontSize:'28px', fontWeight:800, color:'var(--text-primary)', lineHeight:1.1, marginTop:'6px' }}>{c.value.toLocaleString()}</p>
            </div>
            <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <c.icon size={22} style={{ color: c.color }} />
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'16px' }}>

        {/* Today's Attendance */}
        <div className="glass-card" style={{ padding:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'rgba(99,102,241,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <HiOutlineClipboardCheck size={18} style={{ color:'#818cf8' }} />
              </div>
              <div>
                <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)' }}>Today's Attendance</p>
                <p style={{ fontSize:'11px', color:'var(--text-tertiary)' }}>{totalMarked > 0 ? `${attPct}% present` : 'Not marked yet'}</p>
              </div>
            </div>
            <button onClick={() => navigate('/admin/attendance')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', display:'flex', alignItems:'center', gap:'3px', fontSize:'11px' }}>
              Mark <HiOutlineArrowRight size={12} />
            </button>
          </div>
          {/* Progress bar */}
          {totalMarked > 0 && (
            <div style={{ height:'4px', background:'var(--hover-bg)', borderRadius:'99px', marginBottom:'14px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${attPct}%`, background:'linear-gradient(90deg, #6366f1, #22c55e)', borderRadius:'99px', transition:'width 0.8s ease' }} />
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'8px' }}>
            {[
              { label:'Present', count: totalPresent, color:'#22c55e', bg:'rgba(34,197,94,0.08)' },
              { label:'Absent',  count: totalAbsent,  color:'#f87171', bg:'rgba(248,113,113,0.08)' },
              { label:'Late',    count: totalLate,     color:'#fbbf24', bg:'rgba(251,191,36,0.08)' },
              { label:'Leave',   count: totalLeave,    color:'#60a5fa', bg:'rgba(96,165,250,0.08)' },
            ].map(a => (
              <div key={a.label} style={{ padding:'12px', borderRadius:'10px', background:a.bg, textAlign:'center' }}>
                <p style={{ fontSize:'20px', fontWeight:800, color:a.color }}>{a.count}</p>
                <p style={{ fontSize:'11px', color:'var(--text-tertiary)', marginTop:'2px' }}>{a.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Fee Overview */}
        <div className="glass-card" style={{ padding:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'rgba(34,197,94,0.10)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <HiOutlineCurrencyDollar size={18} style={{ color:'#4ade80' }} />
              </div>
              <div>
                <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)' }}>Fee Overview</p>
                <p style={{ fontSize:'11px', color:'var(--text-tertiary)' }}>Current month</p>
              </div>
            </div>
            <button onClick={() => navigate('/admin/fees')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', display:'flex', alignItems:'center', gap:'3px', fontSize:'11px' }}>
              View all <HiOutlineArrowRight size={12} />
            </button>
          </div>
          {(data?.feeStats || []).length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-tertiary)', fontSize:'13px' }}>No fee records this month</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {data.feeStats.map(f => (
                <div key={f._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:'10px', background:'var(--hover-bg)', border:'1px solid var(--border-color)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: f._id==='paid'?'#4ade80':f._id==='partial'?'#fbbf24':'#f87171', flexShrink:0 }} />
                    <span style={{ fontSize:'13px', textTransform:'capitalize', color:'var(--text-secondary)' }}>{f._id}</span>
                    <span style={{ fontSize:'11px', color:'var(--text-tertiary)' }}>({f.count})</span>
                  </div>
                  <span style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)' }}>Rs. {(f.total||0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gate & Visitor Status */}
        <div className="glass-card" style={{ padding:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'rgba(99,102,241,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <HiOutlineShieldCheck size={18} style={{ color:'#818cf8' }} />
              </div>
              <div>
                <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)' }}>Gate & Visitor Status</p>
                <p style={{ fontSize:'11px', color:'var(--text-tertiary)' }}>Gate movements today</p>
              </div>
            </div>
            <button onClick={() => navigate('/admin/visitors')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', display:'flex', alignItems:'center', gap:'3px', fontSize:'11px' }}>
              Logs <HiOutlineArrowRight size={12} />
            </button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'8px' }}>
            {[
              { label:'Students Inside', count: s.currentlyInsideStudents || 0, color:'#818cf8', bg:'rgba(99,102,241,0.06)', sub:'By today\'s scans' },
              { label:'Staff Inside',    count: s.currentlyInsideStaff || 0,    color:'#fbbf24', bg:'rgba(251,191,36,0.06)', sub:'By today\'s scans' },
              { label:'Entries / Exits', count: `${s.todayEntries || 0} / ${s.todayExits || 0}`, color:'#4ade80', bg:'rgba(34,197,94,0.06)', sub:'Gate logs' },
              { label:'Visitors Logged', count: s.todayVisitors || 0,           color:'#60a5fa', bg:'rgba(96,165,250,0.06)', sub:'External visitors' },
            ].map((a, idx) => (
              <div key={idx} style={{ padding:'10px', borderRadius:'10px', background:a.bg, textAlign:'center' }}>
                <p style={{ fontSize:'18px', fontWeight:800, color:a.color }}>{a.count}</p>
                <p style={{ fontSize:'10px', color:'var(--text-secondary)', marginTop:'2px', fontWeight:600 }}>{a.label}</p>
                <p style={{ fontSize:'8px', color:'var(--text-tertiary)', marginTop:'1px' }}>{a.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card" style={{ padding:'20px' }}>
          <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)', marginBottom:'14px' }}>Quick Actions</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            {[
              { label:'Add New Student',    icon: HiOutlineAcademicCap,    path:'/admin/students',        color:'#818cf8' },
              { label:'Mark Attendance',    icon: HiOutlineClipboardCheck,  path:'/admin/attendance',      color:'#4ade80' },
              { label:'Enter Results',      icon: HiOutlineChartBar,        path:'/admin/results/entry',   color:'#60a5fa' },
              { label:'Post Announcement', icon: HiOutlineSpeakerphone,    path:'/admin/announcements',   color:'#fbbf24' },
              { label:'Fee Defaulters',     icon: HiOutlineCurrencyDollar,  path:'/admin/fees/defaulters', color:'#f87171' },
            ].map(a => (
              <button key={a.path} onClick={() => navigate(a.path)} style={{
                display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px',
                background:'var(--hover-bg)', border:'1px solid var(--border-color)',
                borderRadius:'10px', cursor:'pointer', transition:'all 0.12s', textAlign:'left',
              }}
              onMouseOver={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'; }}
              onMouseOut={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'; }}
              >
                <a.icon size={16} style={{ color: a.color, flexShrink:0 }} />
                <span style={{ fontSize:'13px', color:'var(--text-secondary)', flex:1 }}>{a.label}</span>
                <HiOutlineArrowRight size={13} style={{ color:'var(--text-tertiary)', flexShrink:0 }} />
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Activity */}
      <RecentActivityWidget role="admin" />
    </div>
  );
};


export default AdminDashboard;
