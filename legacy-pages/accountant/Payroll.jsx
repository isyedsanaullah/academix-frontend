import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineCash, HiOutlineCheckCircle, HiOutlineClock, HiOutlineX } from 'react-icons/hi';

const Payroll = () => {
  const [staff, setStaff] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ allowances: 0, deductions: 0, bonus: 0, paymentMethod: 'cash', remarks: '' });

  const fetch_ = async () => {
    try {
      const { data } = await api.get('/accountant/payroll', { params: { month } });
      setStaff(data.data || []);
      setSummary(data.summary || {});
    } catch { toast.error('Failed to load payroll'); }
    finally { setLoading(false); }
  };

  useEffect(() => { setLoading(true); fetch_(); }, [month]);

  const paySalary = async () => {
    try {
      await api.post('/accountant/pay-salary', {
        employee_id: payModal._id,
        month,
        ...payForm,
        allowances: Number(payForm.allowances),
        deductions: Number(payForm.deductions),
        bonus: Number(payForm.bonus)
      });
      toast.success('Salary paid!');
      setPayModal(null);
      fetch_();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const net = payModal ? (payModal.salary || 0) + Number(payForm.allowances || 0) - Number(payForm.deductions || 0) + Number(payForm.bonus || 0) : 0;
  const roleColor = { teacher: '#818cf8', employee: '#fbbf24', principal: '#38bdf8', registrar: '#34d399', accountant: '#f97316' };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="animate-spin" style={{ width: 28, height: 28, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} /></div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color:'var(--text-primary)' }}>💼 Payroll</h1>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input-field" style={{ width: 180 }} />
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div className="stat-card">
          <p style={{ fontSize: 10, fontWeight: 700, color:'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Staff</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#818cf8', marginTop: 4 }}>{staff.length}</p>
        </div>
        <div className="stat-card">
          <p style={{ fontSize: 10, fontWeight: 700, color:'var(--text-tertiary)', textTransform: 'uppercase' }}>Pending</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>Rs.{summary.totalPending?.toLocaleString() || 0}</p>
        </div>
        <div className="stat-card">
          <p style={{ fontSize: 10, fontWeight: 700, color:'var(--text-tertiary)', textTransform: 'uppercase' }}>Paid</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#4ade80', marginTop: 4 }}>Rs.{summary.totalPaid?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Staff List */}
      <div className="glass-card" style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border-color)' }}>
              {['Name', 'Role', 'Base Salary', 'Status', 'Net Paid', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color:'var(--text-tertiary)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s._id} style={{ borderBottom:'1px solid var(--border-color)' }}>
                <td style={{ padding: '10px 14px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color:'var(--text-primary)' }}>{s.name}</p>
                  <p style={{ fontSize: 10, color:'var(--text-tertiary)' }}>{s.email}</p>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${roleColor[s.role] || '#818cf8'}15`, color: roleColor[s.role] || '#818cf8', textTransform: 'uppercase' }}>{s.role}</span>
                </td>
                <td style={{ padding: '10px 14px', color:'var(--text-secondary)', fontWeight: 600 }}>Rs.{(s.salary || 0).toLocaleString()}</td>
                <td style={{ padding: '10px 14px' }}>
                  {s.payslip?.status === 'paid' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#4ade80', fontWeight: 600 }}><HiOutlineCheckCircle size={13} /> Paid</span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#fbbf24', fontWeight: 600 }}><HiOutlineClock size={13} /> Pending</span>
                  )}
                </td>
                <td style={{ padding: '10px 14px', color: s.payslip ? '#4ade80' : 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
                  {s.payslip ? `Rs.${s.payslip.netAmount?.toLocaleString()}` : '-'}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  {s.payslip?.status !== 'paid' && s.salary > 0 && (
                    <button onClick={() => { setPayModal(s); setPayForm({ allowances: 0, deductions: 0, bonus: 0, paymentMethod: 'cash', remarks: '' }); }}
                      style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'rgba(74,222,128,0.1)', color: '#4ade80', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                      <HiOutlineCash size={13} style={{ display: 'inline', marginRight: 3 }} /> Pay
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pay Modal */}
      {payModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setPayModal(null)} />
          <div style={{ position: 'relative', zIndex: 1, background: '#131a25', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 24, maxWidth: 420, width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color:'var(--text-primary)' }}>Pay Salary</h3>
              <button onClick={() => setPayModal(null)} style={{ background: 'none', border: 'none', color:'var(--text-tertiary)', cursor: 'pointer' }}><HiOutlineX size={18} /></button>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color:'var(--text-primary)', marginBottom: 4 }}>{payModal.name}</p>
            <p style={{ fontSize: 11, color:'var(--text-tertiary)', marginBottom: 14 }}>{payModal.role} • Base: Rs.{payModal.salary?.toLocaleString()} • Month: {month}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div><label style={{ fontSize: 10, color:'var(--text-tertiary)' }}>Allowances</label><input type="number" value={payForm.allowances} onChange={e => setPayForm({...payForm, allowances: e.target.value})} className="input-field" /></div>
                <div><label style={{ fontSize: 10, color:'var(--text-tertiary)' }}>Deductions</label><input type="number" value={payForm.deductions} onChange={e => setPayForm({...payForm, deductions: e.target.value})} className="input-field" /></div>
                <div><label style={{ fontSize: 10, color:'var(--text-tertiary)' }}>Bonus</label><input type="number" value={payForm.bonus} onChange={e => setPayForm({...payForm, bonus: e.target.value})} className="input-field" /></div>
              </div>
              <select value={payForm.paymentMethod} onChange={e => setPayForm({...payForm, paymentMethod: e.target.value})} className="input-field">
                {['cash', 'bank', 'cheque'].map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
              <input value={payForm.remarks} onChange={e => setPayForm({...payForm, remarks: e.target.value})} placeholder="Remarks (optional)" className="input-field" />

              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', textAlign: 'center' }}>
                <p style={{ fontSize: 10, color:'var(--text-tertiary)' }}>NET PAYABLE</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#4ade80' }}>Rs.{net.toLocaleString()}</p>
              </div>

              <button onClick={paySalary} className="btn-primary">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
