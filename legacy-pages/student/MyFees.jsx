import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MyFees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/fees/my');
        setFees(data.data || []);
      } catch { toast.error('Failed to load fees'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const totalFee = fees.reduce((s, f) => s + (f.totalAmount || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + (f.paidAmount || 0), 0);
  const balance = totalFee - totalPaid;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 800, color:'var(--text-primary)' }}>My Fees</h1>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Fee', value: `Rs. ${totalFee.toLocaleString()}`, color:'var(--text-primary)' },
          { label: 'Paid', value: `Rs. ${totalPaid.toLocaleString()}`, color: '#4ade80' },
          { label: 'Balance Due', value: `Rs. ${balance.toLocaleString()}`, color: balance > 0 ? '#f87171' : '#4ade80' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p style={{ fontSize: '11px', fontWeight: 600, color:'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: s.color, marginTop: '6px' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Records */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Month</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
          <tbody>
            {fees.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color:'var(--text-tertiary)' }}>No fee records</td></tr>
            ) : fees.map(f => (
              <tr key={f._id}>
                <td style={{ fontWeight: 500 }}>{f.month}</td>
                <td>Rs. {f.totalAmount?.toLocaleString()}</td>
                <td style={{ color: '#4ade80' }}>Rs. {f.paidAmount?.toLocaleString()}</td>
                <td style={{ color: '#f87171' }}>Rs. {(f.totalAmount - f.paidAmount).toLocaleString()}</td>
                <td><span className={`badge ${f.status === 'paid' ? 'badge-success' : f.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>{f.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyFees;
