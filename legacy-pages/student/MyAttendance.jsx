import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const MyAttendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/attendance/my');
        setRecords(data.data || []);
      } catch { toast.error('Failed to load attendance'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const leave = records.filter(r => r.status === 'leave').length;
  const total = records.length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 800, color:'var(--text-primary)' }}>My Attendance</h1>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
        {[
          { label: 'Present', value: present, color: '#4ade80', bg: 'rgba(34,197,94,0.08)' },
          { label: 'Absent', value: absent, color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
          { label: 'Late', value: late, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
          { label: 'Leave', value: leave, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
          { label: 'Total', value: total, color:'var(--text-primary)', bg: 'rgba(255,255,255,0.04)' },
          { label: 'Percentage', value: `${pct}%`, color: pct >= 75 ? '#4ade80' : '#f87171', bg: pct >= 75 ? 'rgba(34,197,94,0.08)' : 'rgba(248,113,113,0.08)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '14px', borderRadius: '12px', background: s.bg, textAlign: 'center' }}>
            <p style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: '11px', color:'var(--text-tertiary)', marginTop: '2px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Records */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Date</th><th>Status</th><th>Method</th></tr></thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color:'var(--text-tertiary)' }}>No attendance records yet</td></tr>
            ) : records.map(r => (
              <tr key={r._id}>
                <td>{new Date(r.date).toLocaleDateString()}</td>
                <td><span className={`badge ${r.status === 'present' ? 'badge-success' : r.status === 'absent' ? 'badge-danger' : r.status === 'late' ? 'badge-warning' : 'badge-info'}`}>{r.status}</span></td>
                <td style={{ textTransform: 'capitalize', color:'var(--text-tertiary)' }}>{r.method || 'manual'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyAttendance;
