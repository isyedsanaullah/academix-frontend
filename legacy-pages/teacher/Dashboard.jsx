import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { HiOutlineAcademicCap, HiOutlineClipboardCheck, HiOutlineChartBar, HiOutlineCalendar, HiOutlineArrowRight, HiOutlineQrcode, HiOutlineX } from 'react-icons/hi';
import RecentAnnouncements from '../../components/common/RecentAnnouncements';
import RecentActivityWidget from '../../components/activity/RecentActivityWidget';


const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, exams: 0, todayAttendance: null });
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [stuRes, examRes] = await Promise.all([
          api.get('/students'),
          api.get('/exams')
        ]);
        setStats({
          students: stuRes.data.total || stuRes.data.data?.length || 0,
          exams: examRes.data.data?.length || 0,
        });
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const cardIdVal = user?.qrCode || '';

  const quickActions = [
    { label: 'Mark Attendance', icon: HiOutlineClipboardCheck, path: '/teacher/attendance', color: '#4ade80' },
    { label: 'Enter Results', icon: HiOutlineChartBar, path: '/teacher/results', color: '#60a5fa' },
    { label: 'View Students', icon: HiOutlineAcademicCap, path: '/teacher/students', color: '#818cf8' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color:'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <HiOutlineCalendar style={{ color:'var(--text-tertiary)' }} size={13} />
            <span style={{ fontSize: '12px', color:'var(--text-tertiary)' }}>{today}</span>
            {cardIdVal && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: 4, marginLeft: 8, fontFamily: 'monospace' }}>
                ID: {cardIdVal}
              </span>
            )}
          </div>
        </div>

        {cardIdVal && (
          <button 
            onClick={() => setShowQrModal(true)} 
            className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <HiOutlineQrcode size={16} /> Gate QR Card
          </button>
        )}
      </div>

      {/* ── QR Code Card Modal ── */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 360, textAlign: 'center', padding: 24, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>🪪 Teacher Digital ID Card</span>
              <button onClick={() => setShowQrModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><HiOutlineX size={20} /></button>
            </div>
            
            <div style={{ background: '#ffffff', padding: 20, borderRadius: 16, display: 'inline-block', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', marginBottom: 16 }}>
              <QRCodeSVG value={cardIdVal} size={180} level="H" />
            </div>

            <p style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace', letterSpacing: 1 }}>{cardIdVal}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{user?.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Faculty Member / Teacher</p>
            
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 14, background: 'rgba(56,189,248,0.06)', padding: '8px 12px', borderRadius: 8 }}>
              💡 Scan this QR code at the college main gate camera for entry and exit attendance.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Students', value: stats.students, icon: HiOutlineAcademicCap, color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
          { label: 'Exams Created', value: stats.exams, icon: HiOutlineChartBar, color: '#60a5fa', bg: 'rgba(56,189,248,0.10)' },
        ].map((c, i) => (
          <div key={i} className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color:'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</p>
              <p style={{ fontSize: '28px', fontWeight: 800, color:'var(--text-primary)', lineHeight: 1.1, marginTop: '6px' }}>{c.value}</p>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <c.icon size={22} style={{ color: c.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Announcements */}
      <RecentAnnouncements />

      {/* Quick Actions */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color:'var(--text-primary)', marginBottom: '14px' }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {quickActions.map(a => (
            <button key={a.path} onClick={() => navigate(a.path)} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '14px',
              background:'var(--hover-bg)', border:'1px solid var(--border-color)',
              borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <a.icon size={18} style={{ color: a.color }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color:'var(--text-secondary)', flex: 1 }}>{a.label}</span>
              <HiOutlineArrowRight size={14} style={{ color:'var(--text-tertiary)' }} />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivityWidget role="teacher" />
    </div>
  );
};


export default TeacherDashboard;
