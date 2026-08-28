import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { HiOutlineClipboardCheck, HiOutlineCurrencyDollar, HiOutlineChartBar, HiOutlineCalendar, HiOutlineArrowRight, HiOutlineStar, HiOutlineAcademicCap, HiOutlineQrcode, HiOutlineX } from 'react-icons/hi';
import RecentActivityWidget from '../../components/activity/RecentActivityWidget';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ attendance: [], fees: [], results: [], student: null });
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attRes, feeRes, resRes, stuRes] = await Promise.all([
          api.get('/attendance/my').catch(() => ({ data: { data: [] } })),
          api.get('/fees/my').catch(() => ({ data: { data: [] } })),
          api.get('/results/my').catch(() => ({ data: { data: [] } })),
          api.get('/students/my-profile').catch(() => ({ data: { data: null } })),
        ]);
        setData({
          attendance: attRes.data.data || [],
          fees: feeRes.data.data || [],
          results: resRes.data.data || [],
          student: stuRes.data.data || null,
        });
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const totalDays = data.attendance.length;
  const presentDays = data.attendance.filter(a => a.status === 'present').length;
  const absentDays = data.attendance.filter(a => a.status === 'absent').length;
  const lateDays = data.attendance.filter(a => a.status === 'late').length;
  const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const totalFee = data.fees.reduce((s, f) => s + (f.totalAmount || 0), 0);
  const totalPaid = data.fees.reduce((s, f) => s + (f.paidAmount || 0), 0);
  const balance = totalFee - totalPaid;
  const stu = data.student;
  const cardIdVal = stu?.qrCode || stu?.cardId || stu?.rollNumber || user?.qrCode || '';

  // Monthly attendance chart data (last 6 months)
  const attByMonth = {};
  data.attendance.forEach(a => {
    const m = new Date(a.date).toLocaleDateString('en', { month: 'short', year: '2-digit' });
    if (!attByMonth[m]) attByMonth[m] = { total: 0, present: 0 };
    attByMonth[m].total++;
    if (a.status === 'present') attByMonth[m].present++;
  });
  const attChartData = Object.entries(attByMonth).slice(-6);

  // Results chart data
  const resChartData = data.results.slice(-6).map(r => ({ name: r.exam_id?.name || 'Exam', pct: r.percentage || 0, grade: r.grade }));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Profile Card ── */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', justifyBetween: 'space-between' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flex: 1, minWidth: 260 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 28, fontWeight: 900, color:'var(--text-primary)' }}>
            {stu?.photo ? <img src={stu.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: 18, objectFit: 'cover' }} /> : (user?.name?.[0] || 'S')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color:'var(--text-primary)', margin: 0 }}>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
            <p style={{ fontSize: 12, color:'var(--text-tertiary)', marginTop: 4 }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {stu?.class && <span style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: 11, fontWeight: 600 }}>{stu.class}</span>}
              {stu?.section && <span style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', fontSize: 11, fontWeight: 600 }}>Section {stu.section}</span>}
              {cardIdVal && <span style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>ID: {cardIdVal}</span>}
            </div>
          </div>
        </div>

        {cardIdVal && (
          <button 
            onClick={() => setShowQrModal(true)} 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: 12, border: 'none', cursor: 'pointer', borderRadius: 10 }}
          >
            <HiOutlineQrcode size={18} /> Gate Scan QR Card
          </button>
        )}
      </div>

      {/* ── QR Code Card Modal ── */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 360, textAlign: 'center', padding: 24, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>🪪 Digital Student ID Card</span>
              <button onClick={() => setShowQrModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><HiOutlineX size={20} /></button>
            </div>
            
            <div style={{ background: '#ffffff', padding: 20, borderRadius: 16, display: 'inline-block', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', marginBottom: 16 }}>
              <QRCodeSVG value={cardIdVal} size={180} level="H" />
            </div>

            <p style={{ fontSize: 16, fontWeight: 800, color: '#818cf8', fontFamily: 'monospace', letterSpacing: 1 }}>{cardIdVal}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{user?.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{stu?.class} — Section {stu?.section}</p>
            
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 14, background: 'rgba(99,102,241,0.06)', padding: '8px 12px', borderRadius: 8 }}>
              💡 Scan this QR code at the college main gate camera for entry and exit attendance.
            </p>
          </div>
        </div>
      )}

      {/* ── Quick Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <StatCard label="Attendance" value={`${attPct}%`} sub={`${presentDays}/${totalDays} days`} color={attPct >= 75 ? '#4ade80' : '#f87171'} icon={HiOutlineClipboardCheck} onClick={() => navigate('/student/attendance')} />
        <StatCard label="Fee Balance" value={`Rs.${balance.toLocaleString()}`} sub={`Paid: Rs.${totalPaid.toLocaleString()}`} color={balance > 0 ? '#f87171' : '#4ade80'} icon={HiOutlineCurrencyDollar} onClick={() => navigate('/student/fees')} />
        <StatCard label="Results" value={data.results.length} sub="Exams taken" color="#60a5fa" icon={HiOutlineChartBar} onClick={() => navigate('/student/results')} />
        <StatCard label="Evaluation" value="⭐" sub="Teacher Eval" color="#fbbf24" icon={HiOutlineStar} onClick={() => navigate('/student/evaluation')} />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px' }}>
        {/* Attendance Chart */}
        <div className="glass-card" style={{ padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color:'var(--text-primary)', marginBottom: 16 }}>📊 Monthly Attendance</p>
          {attChartData.length === 0 ? (
            <p style={{ color:'var(--text-tertiary)', fontSize: 12, textAlign: 'center', padding: 30 }}>No attendance data yet</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
              {attChartData.map(([month, d]) => {
                const pct = d.total > 0 ? Math.round((d.present / d.total) * 100) : 0;
                return (
                  <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: pct >= 75 ? '#4ade80' : '#f87171' }}>{pct}%</span>
                    <div style={{ width: '100%', background:'var(--hover-bg)', borderRadius: 6, overflow: 'hidden', height: 80 }}>
                      <div style={{ width: '100%', height: `${pct}%`, background: pct >= 75 ? 'linear-gradient(to top,#22c55e,#4ade80)' : 'linear-gradient(to top,#ef4444,#f87171)', borderRadius: 6, marginTop: 'auto', position: 'relative', top: `${100 - pct}%` }} />
                    </div>
                    <span style={{ fontSize: 9, color:'var(--text-tertiary)' }}>{month}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 12, justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color:'var(--text-tertiary)' }}>✅ Present: {presentDays}</span>
            <span style={{ fontSize: 10, color:'var(--text-tertiary)' }}>❌ Absent: {absentDays}</span>
            <span style={{ fontSize: 10, color:'var(--text-tertiary)' }}>⏰ Late: {lateDays}</span>
          </div>
        </div>

        {/* Results Chart */}
        <div className="glass-card" style={{ padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color:'var(--text-primary)', marginBottom: 16 }}>📈 Exam Results</p>
          {resChartData.length === 0 ? (
            <p style={{ color:'var(--text-tertiary)', fontSize: 12, textAlign: 'center', padding: 30 }}>No results yet</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
              {resChartData.map((r, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: r.grade === 'F' ? '#f87171' : '#4ade80' }}>{r.pct}%</span>
                  <div style={{ width: '100%', background:'var(--hover-bg)', borderRadius: 6, overflow: 'hidden', height: 80 }}>
                    <div style={{ width: '100%', height: `${r.pct}%`, background: r.grade === 'F' ? 'linear-gradient(to top,#ef4444,#f87171)' : 'linear-gradient(to top,#6366f1,#818cf8)', borderRadius: 6, position: 'relative', top: `${100 - r.pct}%` }} />
                  </div>
                  <span style={{ fontSize: 8, color:'var(--text-tertiary)', textAlign: 'center', maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                </div>
              ))}
            </div>
          )}
          {data.results.length > 0 && (
            <button onClick={() => navigate('/student/results')} style={{ marginTop: 12, width: '100%', padding: '8px', borderRadius: 8, border:'1px solid var(--border-color)', background: 'transparent', color:'var(--text-tertiary)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              View all results <HiOutlineArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <RecentActivityWidget role="student" />
    </div>

  );
};

const StatCard = ({ label, value, sub, color, icon: Icon, onClick }) => (
  <button onClick={onClick} className="stat-card" style={{ cursor: 'pointer', textAlign: 'left' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 600, color:'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.1, marginTop: 6 }}>{value}</p>
        <p style={{ fontSize: 10, color:'var(--text-tertiary)', marginTop: 4 }}>{sub}</p>
      </div>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} style={{ color }} />
      </div>
    </div>
  </button>
);

export default StudentDashboard;
