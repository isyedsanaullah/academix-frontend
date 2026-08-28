import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineCurrencyDollar, HiOutlineExclamation } from 'react-icons/hi';

const MyFines = () => {
  const [fines, setFines] = useState([]);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/fines/my');
        setFines(data.data || []);
        setTotalUnpaid(data.totalUnpaid || 0);
      } catch { toast.error('Failed to load fines'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const total = fines.reduce((s, f) => s + f.amount, 0);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}><div className="animate-spin" style={{ width: 32, height: 32, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} /></div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>⚠️ My Fines</h1>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Fines imposed by teachers with reasons</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        <div className="stat-card"><p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Fines</p><p style={{ fontSize: 24, fontWeight: 800, color: '#818cf8', marginTop: 4 }}>{fines.length}</p></div>
        <div className="stat-card"><p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Amount</p><p style={{ fontSize: 24, fontWeight: 800, color: '#f87171', marginTop: 4 }}>Rs.{total.toLocaleString()}</p></div>
        <div className="stat-card"><p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Unpaid</p><p style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>Rs.{totalUnpaid.toLocaleString()}</p></div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Fine Details</p>
        </div>
        {fines.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}><HiOutlineCurrencyDollar size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} /><p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No fines — Keep it up! 👍</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>{['Date', 'Teacher', 'Category', 'Reason', 'Amount', 'Status'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
              <tbody>
                {fines.map(f => (
                  <tr key={f._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}<br/><span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{new Date(f.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.teacher_id?.name || '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{f.category}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', maxWidth: 250 }}>{f.reason}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f87171' }}>Rs.{f.amount}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: f.status === 'paid' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', color: f.status === 'paid' ? '#4ade80' : '#f87171' }}>{f.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFines;
