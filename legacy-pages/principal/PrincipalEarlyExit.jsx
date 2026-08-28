import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineClock, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';

const PrincipalEarlyExit = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [remarks, setRemarks] = useState({});

  useEffect(() => { fetch(); }, [filter]);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/gate/early-exit/pending', { params: { status: filter } });
      setRequests(data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleReview = async (id, status) => {
    try {
      await api.put(`/gate/early-exit/${id}/review`, { status, approvalRemarks: remarks[id] || '' });
      toast.success(`Request ${status}`);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const sc = { pending: '#fbbf24', approved: '#4ade80', rejected: '#f87171' };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>🚪 Early Exit Approvals</h1>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Approve or reject early exit requests from students, teachers and staff</p>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {['pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-color)', background: filter === f ? 'rgba(99,102,241,0.1)' : 'transparent', color: filter === f ? '#818cf8' : 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="animate-spin" style={{ width: 28, height: 28, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto' }} /></div> : requests.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No {filter} requests</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requests.map(r => (
            <div key={r._id} className="glass-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{r.personName}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: r.personType === 'student' ? 'rgba(99,102,241,0.1)' : 'rgba(56,189,248,0.1)', color: r.personType === 'student' ? '#818cf8' : '#38bdf8' }}>{r.personType}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}><b>Reason:</b> {r.reason}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>📅 {new Date(r.exitDate).toLocaleDateString()} {r.exitTime && `at ${r.exitTime}`} • Requested {new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${sc[r.status]}15`, color: sc[r.status] }}>{r.status}{r.used ? ' ✓ Used' : ''}</span>
              </div>
              {r.status === 'pending' && (
                <div style={{ marginTop: 12, padding: 12, background: 'var(--hover-bg)', borderRadius: 8 }}>
                  <input value={remarks[r._id] || ''} onChange={e => setRemarks(p => ({...p, [r._id]: e.target.value}))} placeholder="Remarks (optional)..." className="form-input" style={{ marginBottom: 10 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleReview(r._id, 'approved')} style={{ padding: '6px 16px', borderRadius: 6, background: '#22c55e', color:'var(--text-primary)', fontWeight: 600, fontSize: 11, border: 'none', cursor: 'pointer' }}>✅ Approve</button>
                    <button onClick={() => handleReview(r._id, 'rejected')} style={{ padding: '6px 16px', borderRadius: 6, background: '#ef4444', color:'var(--text-primary)', fontWeight: 600, fontSize: 11, border: 'none', cursor: 'pointer' }}>❌ Reject</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrincipalEarlyExit;
