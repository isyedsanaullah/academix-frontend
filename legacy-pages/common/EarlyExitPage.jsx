import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineClock, HiOutlineCheck, HiOutlineX, HiOutlinePlus } from 'react-icons/hi';
import MyQRCode from '../../components/common/MyQRCode';

const EarlyExitPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reason: '', exitDate: new Date().toISOString().slice(0,10), exitTime: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetch(); }, []);
  const fetch = async () => {
    try { const { data } = await api.get('/gate/early-exit/my'); setRequests(data.data || []); }
    catch {} finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason) return toast.error('Reason is required');
    setSubmitting(true);
    try {
      await api.post('/gate/early-exit', form);
      toast.success('Request submitted');
      setShowForm(false); setForm({ reason: '', exitDate: new Date().toISOString().slice(0,10), exitTime: '' });
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const sc = { pending: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' }, approved: { bg: 'rgba(74,222,128,0.12)', color: '#4ade80' }, rejected: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' } };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>🚪 Early Exit Request</h1>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Request permission to leave before college closing time</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'var(--text-primary)', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
          <HiOutlinePlus size={16} /> New Request
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Exit Date</label><input type="date" value={form.exitDate} onChange={e => setForm({...form, exitDate: e.target.value})} className="form-input" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Exit Time</label><input type="time" value={form.exitTime} onChange={e => setForm({...form, exitTime: e.target.value})} className="form-input" /></div>
          </div>
          <div style={{ marginTop: 14 }}><label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Reason *</label><textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required rows={3} className="form-input" placeholder="Why do you need early exit?" /></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ padding: '8px 24px', borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'var(--text-primary)', fontWeight: 600, fontSize: 12, border: 'none', cursor: 'pointer' }}>{submitting ? '...' : 'Submit'}</button>
          </div>
        </form>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="animate-spin" style={{ width: 28, height: 28, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto' }} /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requests.length === 0 ? <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No exit requests</div> :
            requests.map(r => (
              <div key={r._id} className="glass-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.reason}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>📅 {new Date(r.exitDate).toLocaleDateString()} {r.exitTime && `at ${r.exitTime}`}</p>
                    {r.approvalRemarks && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Principal: {r.approvalRemarks}</p>}
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: sc[r.status]?.bg, color: sc[r.status]?.color }}>{r.status}{r.used ? ' (Used)' : ''}</span>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
};

export default EarlyExitPage;
