import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineClipboardCheck, HiOutlineCalendar, HiOutlineCheckCircle,
  HiOutlineXCircle, HiOutlineClock, HiOutlineEye, HiOutlineSearch,
  HiOutlinePlus, HiOutlineX, HiOutlineBeaker
} from 'react-icons/hi';

const Applications = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // 'view' | 'reject' | 'test'
  const [rejectReason, setRejectReason] = useState('');
  const [testData, setTestData] = useState({ date: '', venue: '' });

  const fetchApps = async () => {
    try {
      const params = {};
      if (filter) params.status = filter;
      if (search) params.search = search;
      const { data } = await api.get('/registrar/applications', { params });
      setApps(data.data || []);
      setStats(data.stats || {});
    } catch { toast.error('Failed to load applications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApps(); }, [filter]);

  const approve = async (id) => {
    try {
      await api.put(`/registrar/applications/${id}/approve`, { remarks: 'Approved by registrar' });
      toast.success('Application approved! Student enrolled.');
      fetchApps();
      setModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const reject = async () => {
    try {
      await api.put(`/registrar/applications/${selected._id}/reject`, { reason: rejectReason });
      toast.success('Application rejected');
      fetchApps();
      setModal(null);
      setRejectReason('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const scheduleTest = async () => {
    try {
      await api.put(`/registrar/applications/${selected._id}/entry-test`, testData);
      toast.success('Entry test scheduled');
      fetchApps();
      setModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statusBadge = (s) => {
    const map = {
      submitted: { bg: '#fbbf2415', color: '#fbbf24', label: 'Submitted' },
      under_review: { bg: '#38bdf815', color: '#38bdf8', label: 'Under Review' },
      entry_test: { bg: '#a78bfa15', color: '#a78bfa', label: 'Entry Test' },
      approved: { bg: '#4ade8015', color: '#4ade80', label: 'Approved' },
      rejected: { bg: '#f8717115', color: '#f87171', label: 'Rejected' },
      enrolled: { bg: '#34d39915', color: '#34d399', label: 'Enrolled' }
    };
    const m = map[s] || { bg: '#ffffff10', color:'var(--text-primary)', label: s };
    return <span style={{ fontSize: 10, fontWeight: 700, background: m.bg, color: m.color, padding: '3px 8px', borderRadius: 5, textTransform: 'uppercase' }}>{m.label}</span>;
  };

  const statCards = [
    { label: 'Total', value: Object.values(stats).reduce((a, b) => a + b, 0), color: '#818cf8' },
    { label: 'Pending', value: (stats.submitted || 0) + (stats.under_review || 0), color: '#fbbf24' },
    { label: 'Approved', value: stats.approved || 0, color: '#4ade80' },
    { label: 'Rejected', value: stats.rejected || 0, color: '#f87171' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color:'var(--text-primary)' }}>📋 Applications</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <p style={{ fontSize: 10, fontWeight: 700, color:'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {['', 'submitted', 'under_review', 'entry_test', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            background: filter === f ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
            color: filter === f ? '#818cf8' : 'rgba(255,255,255,0.35)'
          }}>
            {f ? f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchApps()}
            placeholder="Search name/email..." style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background:'var(--hover-bg)', color:'var(--text-primary)', fontSize: 12, width: 180, outline: 'none' }} />
          <button onClick={fetchApps} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#6366f1', color:'var(--text-primary)', cursor: 'pointer' }}><HiOutlineSearch size={14} /></button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border-color)' }}>
              {['App #', 'Name', 'Group', 'Aggregate', 'Phone', 'Status', 'Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color:'var(--text-tertiary)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color:'var(--text-tertiary)' }}>Loading...</td></tr>
            ) : apps.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color:'var(--text-tertiary)' }}>No applications found</td></tr>
            ) : apps.map(a => (
              <tr key={a._id} style={{ borderBottom:'1px solid var(--border-color)', cursor: 'pointer' }}
                onClick={() => { setSelected(a); setModal('view'); }}>
                <td style={{ padding: '10px 14px', color: '#818cf8', fontWeight: 600 }}>{a.applicationNumber}</td>
                <td style={{ padding: '10px 14px', color:'var(--text-primary)', fontWeight: 600 }}>{a.name}<br/><span style={{ fontSize: 10, color:'var(--text-tertiary)' }}>{a.email}</span></td>
                <td style={{ padding: '10px 14px', color:'var(--text-secondary)' }}>{a.preferredGroup}</td>
                <td style={{ padding: '10px 14px', color: a.sscAggregate >= 60 ? '#4ade80' : '#f87171', fontWeight: 700 }}>{a.sscAggregate || '-'}%</td>
                <td style={{ padding: '10px 14px', color:'var(--text-tertiary)' }}>{a.phone}</td>
                <td style={{ padding: '10px 14px' }}>{statusBadge(a.status)}</td>
                <td style={{ padding: '10px 14px', color:'var(--text-tertiary)', fontSize: 11 }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(a.status === 'submitted' || a.status === 'under_review') && (
                      <>
                        <button onClick={() => approve(a._id)} title="Approve" style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: 'rgba(74,222,128,0.1)', color: '#4ade80', cursor: 'pointer' }}><HiOutlineCheckCircle size={14} /></button>
                        <button onClick={() => { setSelected(a); setModal('reject'); }} title="Reject" style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: 'rgba(248,113,113,0.1)', color: '#f87171', cursor: 'pointer' }}><HiOutlineXCircle size={14} /></button>
                        <button onClick={() => { setSelected(a); setModal('test'); }} title="Schedule Test" style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: 'rgba(167,139,250,0.1)', color: '#a78bfa', cursor: 'pointer' }}><HiOutlineBeaker size={14} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── View Modal ── */}
      {modal === 'view' && selected && (
        <Modal onClose={() => setModal(null)} title={`Application: ${selected.applicationNumber}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
            <Info label="Name" value={selected.name} />
            <Info label="Father" value={selected.fatherName} />
            <Info label="Email" value={selected.email} />
            <Info label="Phone" value={selected.phone} />
            <Info label="Gender" value={selected.gender} />
            <Info label="DOB" value={selected.dateOfBirth ? new Date(selected.dateOfBirth).toLocaleDateString() : '-'} />
            <Info label="CNIC" value={selected.cnic || '-'} />
            <Info label="Address" value={selected.address} />
            <Info label="Board" value={selected.sscBoard} />
            <Info label="SSC Year" value={selected.sscYear} />
            <Info label="Marks" value={`${selected.sscObtainedMarks}/${selected.sscTotalMarks}`} />
            <Info label="Aggregate" value={`${selected.sscAggregate}%`} highlight />
            <Info label="Group" value={selected.preferredGroup} />
            <Info label="Class" value={selected.preferredClass} />
            <Info label="Status" value={selected.status} />
            <Info label="Result" value={selected.sscResultStatus} />
          </div>
          {(selected.status === 'submitted' || selected.status === 'under_review') && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => approve(selected._id)} className="btn-primary" style={{ fontSize: 12 }}>✅ Approve & Enroll</button>
              <button onClick={() => setModal('reject')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.1)', color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>❌ Reject</button>
              <button onClick={() => setModal('test')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.1)', color: '#a78bfa', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>🧪 Schedule Test</button>
            </div>
          )}
        </Modal>
      )}

      {/* ── Reject Modal ── */}
      {modal === 'reject' && selected && (
        <Modal onClose={() => setModal(null)} title="Reject Application">
          <p style={{ fontSize: 12, color:'var(--text-secondary)', marginBottom: 12 }}>Rejecting: {selected.name} ({selected.applicationNumber})</p>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={3}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background:'var(--hover-bg)', color:'var(--text-primary)', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
          <button onClick={reject} style={{ marginTop: 12, padding: '10px 20px', borderRadius: 8, border: 'none', background: '#f87171', color:'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>Confirm Rejection</button>
        </Modal>
      )}

      {/* ── Schedule Test Modal ── */}
      {modal === 'test' && selected && (
        <Modal onClose={() => setModal(null)} title="Schedule Entry Test">
          <p style={{ fontSize: 12, color:'var(--text-secondary)', marginBottom: 12 }}>For: {selected.name} ({selected.applicationNumber})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="date" value={testData.date} onChange={e => setTestData({...testData, date: e.target.value})} className="input-field" style={{ fontSize: 12 }} />
            <input value={testData.venue} onChange={e => setTestData({...testData, venue: e.target.value})} placeholder="Venue (e.g. Main Hall)" className="input-field" style={{ fontSize: 12 }} />
          </div>
          <button onClick={scheduleTest} style={{ marginTop: 12, padding: '10px 20px', borderRadius: 8, border: 'none', background: '#8b5cf6', color:'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>Schedule Test</button>
        </Modal>
      )}
    </div>
  );
};

// ── Helpers ──
const Modal = ({ onClose, title, children }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
    <div style={{ position: 'relative', zIndex: 1, background: '#131a25', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 24, maxWidth: 600, width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color:'var(--text-primary)' }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color:'var(--text-tertiary)', cursor: 'pointer' }}><HiOutlineX size={18} /></button>
      </div>
      {children}
    </div>
  </div>
);

const Info = ({ label, value, highlight }) => (
  <div>
    <p style={{ fontSize: 10, color:'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
    <p style={{ fontSize: 13, color: highlight ? '#818cf8' : 'rgba(255,255,255,0.7)', fontWeight: highlight ? 700 : 500, marginTop: 2 }}>{value || '-'}</p>
  </div>
);

export default Applications;
