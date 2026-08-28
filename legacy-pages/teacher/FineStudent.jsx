import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineCurrencyDollar, HiOutlinePlus, HiOutlineQrcode } from 'react-icons/hi';

const categories = [
  { value: 'discipline', label: 'Discipline', icon: '⚖️' },
  { value: 'late', label: 'Late Coming', icon: '⏰' },
  { value: 'uniform', label: 'Uniform', icon: '👔' },
  { value: 'damage', label: 'Property Damage', icon: '🔨' },
  { value: 'cheating', label: 'Cheating', icon: '🚫' },
  { value: 'other', label: 'Other', icon: '📝' },
];

const FineStudent = () => {
  const [fines, setFines] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ student_id: '', amount: '', reason: '', category: 'discipline' });
  const [search, setSearch] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [fRes, sRes] = await Promise.all([
        api.get('/fines/issued'),
        api.get('/students', { params: { limit: 500 } })
      ]);
      setFines(fRes.data.data || []);
      setStudents(sRes.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_id || !form.amount || !form.reason) return toast.error('All fields required');
    setSubmitting(true);
    try {
      await api.post('/fines', { ...form, amount: parseInt(form.amount) });
      toast.success('Fine imposed successfully');
      setShowForm(false);
      setForm({ student_id: '', amount: '', reason: '', category: 'discipline' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const totalFines = fines.reduce((s, f) => s + f.amount, 0);
  const unpaidFines = fines.filter(f => f.status === 'unpaid');
  const filteredStudents = search ? students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNumber?.includes(search)) : students;

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}><div className="animate-spin" style={{ width: 32, height: 32, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} /></div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>💰 Student Fines</h1>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Fine students with a reason. It adds to their fee record.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #ef4444, #f87171)', color:'var(--text-primary)', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
          <HiOutlinePlus size={16} /> Impose Fine
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        <div className="stat-card"><p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Fines Issued</p><p style={{ fontSize: 24, fontWeight: 800, color: '#818cf8', marginTop: 4 }}>{fines.length}</p></div>
        <div className="stat-card"><p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Amount</p><p style={{ fontSize: 24, fontWeight: 800, color: '#f87171', marginTop: 4 }}>Rs.{totalFines.toLocaleString()}</p></div>
        <div className="stat-card"><p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Unpaid</p><p style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>{unpaidFines.length}</p></div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>⚠️ Impose Fine on Student</p>
          {/* QR Scanner */}
          <div style={{ marginBottom: 14, padding: 14, background: 'rgba(99,102,241,0.06)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.1)' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><HiOutlineQrcode size={14} /> Scan Student Card QR</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Scan QR code from student card..." className="form-input" style={{ flex: 1 }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    e.preventDefault();
                    try {
                      const { data } = await api.get('/gate/lookup', { params: { qrCode: e.target.value.trim() } });
                      if (data.data?.id) {
                        setForm(f => ({...f, student_id: data.data.id}));
                        toast.success(`Found: ${data.data.name}`);
                      }
                    } catch { toast.error('Student not found for this QR'); }
                    e.target.value = '';
                  }
                }} />
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', alignSelf: 'center' }}>Press Enter after scan</span>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Or Search Student</label>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or roll number..." className="form-input" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Student *</label>
              <select value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} required className="form-input">
                <option value="">Select student</option>
                {filteredStudents.map(s => <option key={s._id} value={s._id}>{s.name} — {s.rollNumber} ({s.class} {s.section})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Amount (Rs.) *</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} min={1} required className="form-input" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="form-input">
                {categories.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Reason *</label>
            <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required rows={3} maxLength={500} placeholder="Why is this student being fined..." className="form-input" />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ padding: '8px 24px', borderRadius: 8, background: 'linear-gradient(135deg, #ef4444, #f87171)', color:'var(--text-primary)', fontWeight: 600, fontSize: 12, border: 'none', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Submitting...' : 'Impose Fine'}</button>
          </div>
        </form>
      )}

      {/* Fines Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Fine History</p>
        </div>
        {fines.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}><HiOutlineCurrencyDollar size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} /><p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No fines issued</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>{['Student', 'Roll#', 'Class', 'Amount', 'Category', 'Reason', 'Date', 'Status'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
              <tbody>
                {fines.map(f => {
                  const cat = categories.find(c => c.value === f.category);
                  return (
                    <tr key={f._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.student_id?.name || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{f.student_id?.rollNumber || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{f.student_id?.class} {f.student_id?.section}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f87171' }}>Rs.{f.amount}</td>
                      <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 10 }}>{cat?.icon} {cat?.label}</span></td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.reason}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-tertiary)', fontSize: 11 }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 14px' }}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: f.status === 'paid' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', color: f.status === 'paid' ? '#4ade80' : '#f87171' }}>{f.status}</span></td>
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

export default FineStudent;
