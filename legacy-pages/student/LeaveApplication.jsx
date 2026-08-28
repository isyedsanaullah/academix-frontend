import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineDocumentText, HiOutlineCheck, HiOutlineX, HiOutlineClock, HiOutlinePlus } from 'react-icons/hi';

const categories = [
  { value: 'medical', label: '🏥 Medical', color: '#f87171' },
  { value: 'family', label: '👨‍👩‍👧 Family', color: '#fbbf24' },
  { value: 'personal', label: '🙋 Personal', color: '#60a5fa' },
  { value: 'emergency', label: '🚨 Emergency', color: '#ef4444' },
  { value: 'other', label: '📝 Other', color: '#94a3b8' },
];

const statusColors = {
  pending: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', label: 'Pending' },
  approved: { bg: 'rgba(74,222,128,0.12)', color: '#4ade80', label: 'Approved' },
  rejected: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: 'Rejected' },
};

const LeaveApplication = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ leaveDate: '', leaveDateEnd: '', reason: '', category: 'personal' });

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    try {
      const { data } = await api.get('/leaves/my');
      setLeaves(data.data || []);
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.leaveDate || !form.reason) return toast.error('Date and reason are required');
    setSubmitting(true);
    try {
      await api.post('/leaves/apply', form);
      toast.success('Leave application submitted');
      setShowForm(false);
      setForm({ leaveDate: '', leaveDateEnd: '', reason: '', category: 'personal' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Leave Applications</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: 4 }}>Apply for leave when you're absent</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'var(--text-primary)', fontWeight: 600,
          fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
        }}>
          <HiOutlinePlus size={16} /> Apply Leave
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {[
          { label: 'Total', value: stats.total, color: '#818cf8' },
          { label: 'Pending', value: stats.pending, color: '#fbbf24' },
          { label: 'Approved', value: stats.approved, color: '#4ade80' },
          { label: 'Rejected', value: stats.rejected, color: '#f87171' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>📝 New Leave Application</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Leave Date *</label>
              <input type="date" value={form.leaveDate} onChange={e => setForm({ ...form, leaveDate: e.target.value })} required className="form-input" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>End Date (multi-day)</label>
              <input type="date" value={form.leaveDateEnd} onChange={e => setForm({ ...form, leaveDateEnd: e.target.value })} className="form-input" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="form-input">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Reason *</label>
            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required rows={3} maxLength={500} placeholder="Explain your reason for leave..." className="form-input" style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ padding: '8px 24px', borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'var(--text-primary)', fontWeight: 600, fontSize: 12, border: 'none', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      )}

      {/* Leave List */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>My Applications</p>
        </div>
        {leaves.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <HiOutlineDocumentText size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No leave applications yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Date', 'End Date', 'Category', 'Reason', 'Status', 'Admin Remarks'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaves.map(l => {
                  const sc = statusColors[l.status];
                  const cat = categories.find(c => c.value === l.category);
                  return (
                    <tr key={l._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {new Date(l.leaveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {l.leaveDateEnd ? new Date(l.leaveDateEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 6, background: `${cat?.color}15`, color: cat?.color, fontSize: 10, fontWeight: 600 }}>{cat?.label || l.category}</span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 700 }}>
                          {l.status === 'pending' && <HiOutlineClock size={11} />}
                          {l.status === 'approved' && <HiOutlineCheck size={11} />}
                          {l.status === 'rejected' && <HiOutlineX size={11} />}
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-tertiary)', fontSize: 11 }}>{l.reviewRemarks || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveApplication;
