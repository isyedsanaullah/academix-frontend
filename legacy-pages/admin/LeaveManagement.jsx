import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineDocumentText, HiOutlineCheck, HiOutlineX, HiOutlineClock } from 'react-icons/hi';

const statusColors = {
  pending: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', label: 'Pending' },
  approved: { bg: 'rgba(74,222,128,0.12)', color: '#4ade80', label: 'Approved' },
  rejected: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: 'Rejected' },
};

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      const [lRes, sRes] = await Promise.all([
        api.get('/leaves', { params }),
        api.get('/leaves/stats').catch(() => ({ data: { data: {} } }))
      ]);
      setLeaves(lRes.data.data || []);
      setStats(sRes.data.data || {});
    } catch {} finally { setLoading(false); }
  };

  const handleReview = async (id, status) => {
    try {
      await api.put(`/leaves/${id}/review`, { status, reviewRemarks: remarks });
      toast.success(`Leave ${status}`);
      setReviewingId(null);
      setRemarks('');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>📋 Leave Applications</h1>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Review student leave applications. Approved = attendance marked as leave.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {[
          { label: 'Pending', value: stats.pending || 0, color: '#fbbf24' },
          { label: 'Approved', value: stats.approved || 0, color: '#4ade80' },
          { label: 'Rejected', value: stats.rejected || 0, color: '#f87171' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter(filter === s.label.toLowerCase() ? '' : s.label.toLowerCase())}>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{s.label}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {['', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-color)', background: filter === f ? 'rgba(99,102,241,0.1)' : 'transparent', color: filter === f ? '#818cf8' : 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            {f || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}><div className="animate-spin" style={{ width: 28, height: 28, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} /></div>
      ) : leaves.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}><HiOutlineDocumentText size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} /><p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No leave applications</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leaves.map(l => {
            const sc = statusColors[l.status];
            const isReviewing = reviewingId === l._id;
            return (
              <div key={l._id} className="glass-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{l.student_id?.name || '—'}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{l.student_id?.rollNumber}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{l.student_id?.class} {l.student_id?.section}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}><b>Reason:</b> {l.reason}</p>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-tertiary)' }}>
                      <span>📅 {new Date(l.leaveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{l.leaveDateEnd ? ` → ${new Date(l.leaveDateEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
                      <span>• {l.category}</span>
                      <span>• Applied {new Date(l.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 700 }}>
                      {l.status === 'pending' && <HiOutlineClock size={11} />}{l.status === 'approved' && <HiOutlineCheck size={11} />}{l.status === 'rejected' && <HiOutlineX size={11} />}
                      {sc.label}
                    </span>
                    {l.status === 'pending' && !isReviewing && (
                      <button onClick={() => setReviewingId(l._id)} style={{ fontSize: 10, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Review →</button>
                    )}
                  </div>
                </div>
                {isReviewing && (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--hover-bg)', borderRadius: 8 }}>
                    <input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Admin remarks (optional)..." className="form-input" style={{ marginBottom: 10 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleReview(l._id, 'approved')} style={{ padding: '6px 16px', borderRadius: 6, background: '#22c55e', color:'var(--text-primary)', fontWeight: 600, fontSize: 11, border: 'none', cursor: 'pointer' }}>✅ Approve</button>
                      <button onClick={() => handleReview(l._id, 'rejected')} style={{ padding: '6px 16px', borderRadius: 6, background: '#ef4444', color:'var(--text-primary)', fontWeight: 600, fontSize: 11, border: 'none', cursor: 'pointer' }}>❌ Reject</button>
                      <button onClick={() => { setReviewingId(null); setRemarks(''); }} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )}
                {l.reviewRemarks && <p style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}><b>Admin:</b> {l.reviewRemarks}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
