import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineClipboardCheck, HiOutlineCalendar, HiOutlineCheckCircle,
  HiOutlineXCircle, HiOutlineClock, HiOutlineEye, HiOutlineSearch,
  HiOutlinePlus, HiOutlineX, HiOutlineBeaker, HiOutlineDocumentText,
  HiOutlineSparkles, HiOutlineUserGroup, HiOutlineBadgeCheck
} from 'react-icons/hi';

const Applications = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // 'view' | 'reject' | 'test' | 'desk' | 'merit'
  const [rejectReason, setRejectReason] = useState('');
  const [testData, setTestData] = useState({ date: '', venue: '' });

  // Phase 8: Desk entry form state
  const [deskForm, setDeskForm] = useState({
    name: '', fatherName: '', email: '', phone: '', gender: 'Male', dateOfBirth: '', cnic: '',
    address: '', preferredGroup: 'Pre-Medical', preferredClass: '11th',
    sscBoard: 'BISE Lahore', sscRollNumber: '', sscTotalMarks: 1100, sscObtainedMarks: '',
    quota: 'Open Merit', isEquivalence: false, equivalenceBoard: '', equivalenceMarks: ''
  });

  // Phase 8: Merit List state
  const [meritGroup, setMeritGroup] = useState('Pre-Medical');
  const [meritData, setMeritData] = useState(null);
  const [meritLoading, setMeritLoading] = useState(false);

  // Phase 8: Document note state
  const [docRejectNote, setDocRejectNote] = useState('');
  const [verifyingDoc, setVerifyingDoc] = useState(null);

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
      await api.put(`/registrar/applications/${selected.id || selected._id}/reject`, { reason: rejectReason });
      toast.success('Application rejected');
      fetchApps();
      setModal(null);
      setRejectReason('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const scheduleTest = async () => {
    try {
      await api.put(`/registrar/applications/${selected.id || selected._id}/entry-test`, testData);
      toast.success('Entry test scheduled');
      fetchApps();
      setModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // Phase 8: Submit Desk Entry
  const handleDeskSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...deskForm,
        sscTotalMarks: Number(deskForm.sscTotalMarks) || 1100,
        sscObtainedMarks: Number(deskForm.sscObtainedMarks) || 0,
        equivalenceMarks: deskForm.isEquivalence ? Number(deskForm.equivalenceMarks) : undefined,
        equivalenceBoard: deskForm.isEquivalence ? deskForm.equivalenceBoard : undefined
      };
      const { data } = await api.post('/registrar/applications/desk', payload);
      toast.success(`Desk application created: ${data.data?.applicationNumber || 'Success'}`);
      setModal(null);
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create desk application');
    }
  };

  // Phase 8: Verify individual document
  const handleVerifyDocument = async (docKey, ok, note = '') => {
    if (!selected) return;
    try {
      const appId = selected.id || selected._id;
      const { data } = await api.put(`/registrar/applications/${appId}/documents/${docKey}`, { ok, note });
      toast.success(`Document ${docKey} marked as ${ok ? 'Verified' : 'Rejected'}`);
      setSelected(prev => ({
        ...prev,
        docVerification: data.docVerification || {
          ...(prev.docVerification || {}),
          [docKey]: { ok, by: user?.name || 'Registrar', at: new Date().toISOString(), note }
        }
      }));
      setVerifyingDoc(null);
      setDocRejectNote('');
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update document status');
    }
  };

  // Phase 8: Fetch Merit List
  const fetchMeritList = async (group) => {
    setMeritLoading(true);
    try {
      const { data } = await api.get(`/registrar/merit-list?group=${encodeURIComponent(group || meritGroup)}`);
      setMeritData(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate merit list');
    } finally {
      setMeritLoading(false);
    }
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

  const standardDocs = [
    { key: 'ssc_certificate', label: 'SSC / Matric Result Card' },
    { key: 'cnic_bform', label: 'CNIC / B-Form' },
    { key: 'character_cert', label: 'Character Certificate' },
    { key: 'domicile', label: 'Domicile Certificate' },
    ...(selected?.equivalenceBoard ? [{ key: 'equivalence_cert', label: `IBCC Equivalence (${selected.equivalenceBoard})` }] : [])
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color:'var(--text-primary)' }}>📋 Admissions & Applications</h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Manage walk-in desk entries, online applications, document verification & quota merit lists</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              setModal('merit');
              fetchMeritList(meritGroup);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}
          >
            <HiOutlineUserGroup size={16} /> Merit List & Quotas
          </button>
          <button
            onClick={() => setModal('desk')}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}
          >
            <HiOutlinePlus size={16} /> New Desk Entry (Walk-In)
          </button>
        </div>
      </div>

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
            placeholder="Search name/email/app #..." style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background:'var(--hover-bg)', color:'var(--text-primary)', fontSize: 12, width: 200, outline: 'none' }} />
          <button onClick={fetchApps} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#6366f1', color:'var(--text-primary)', cursor: 'pointer' }}><HiOutlineSearch size={14} /></button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border-color)' }}>
              {['App #', 'Applicant', 'Group', 'Source', 'Quota', 'Merit %', 'Docs', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color:'var(--text-tertiary)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color:'var(--text-tertiary)' }}>Loading...</td></tr>
            ) : apps.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color:'var(--text-tertiary)' }}>No applications found</td></tr>
            ) : apps.map(a => {
              const appId = a.id || a._id;
              const docCount = a.docVerification ? Object.keys(a.docVerification).length : 0;
              const docOk = a.docVerification ? Object.values(a.docVerification).filter(d => d.ok).length : 0;
              return (
                <tr key={appId} style={{ borderBottom:'1px solid var(--border-color)', cursor: 'pointer' }}
                  onClick={() => { setSelected(a); setModal('view'); }}>
                  <td style={{ padding: '10px 14px', color: '#818cf8', fontWeight: 600 }}>
                    {a.applicationNumber}
                  </td>
                  <td style={{ padding: '10px 14px', color:'var(--text-primary)', fontWeight: 600 }}>
                    {a.name}<br/>
                    <span style={{ fontSize: 10, color:'var(--text-tertiary)' }}>{a.phone || a.email}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color:'var(--text-secondary)' }}>{a.preferredGroup}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: a.source === 'DESK' ? 'rgba(56,189,248,0.15)' : 'rgba(168,85,247,0.15)',
                      color: a.source === 'DESK' ? '#38bdf8' : '#c084fc'
                    }}>
                      {a.source || 'ONLINE'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                      background: a.quota && a.quota !== 'Open Merit' ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.05)',
                      color: a.quota && a.quota !== 'Open Merit' ? '#facc15' : 'var(--text-secondary)'
                    }}>
                      {a.quota || 'Open Merit'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: (a.meritScore || a.sscAggregate) >= 60 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                    {a.meritScore || a.sscAggregate || '-'}%
                    {a.equivalenceMarks ? <span style={{ fontSize: 9, color: '#38bdf8', display: 'block' }}>Equiv</span> : null}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, color: docOk > 0 ? '#4ade80' : 'var(--text-tertiary)', fontWeight: 600 }}>
                      {docOk > 0 ? `✓ ${docOk} verified` : '0 verified'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>{statusBadge(a.status)}</td>
                  <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(a.status === 'submitted' || a.status === 'under_review') && (
                        <>
                          <button onClick={() => approve(appId)} title="Approve & Enroll" style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: 'rgba(74,222,128,0.1)', color: '#4ade80', cursor: 'pointer' }}><HiOutlineCheckCircle size={14} /></button>
                          <button onClick={() => { setSelected(a); setModal('reject'); }} title="Reject" style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: 'rgba(248,113,113,0.1)', color: '#f87171', cursor: 'pointer' }}><HiOutlineXCircle size={14} /></button>
                          <button onClick={() => { setSelected(a); setModal('test'); }} title="Schedule Test" style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: 'rgba(167,139,250,0.1)', color: '#a78bfa', cursor: 'pointer' }}><HiOutlineBeaker size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── View Modal with Document Verification ── */}
      {modal === 'view' && selected && (
        <Modal onClose={() => setModal(null)} title={`Application: ${selected.applicationNumber}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
            <Info label="Name" value={selected.name} />
            <Info label="Father Name" value={selected.fatherName} />
            <Info label="Email" value={selected.email} />
            <Info label="Phone" value={selected.phone} />
            <Info label="Gender" value={selected.gender} />
            <Info label="Source" value={`${selected.source || 'ONLINE'} ${selected.enteredBy ? `(Entered by: ${selected.enteredBy})` : ''}`} />
            <Info label="Quota" value={selected.quota || 'Open Merit'} highlight />
            <Info label="Merit Score" value={`${selected.meritScore || selected.sscAggregate || '-'}%`} highlight />
            <Info label="Preferred Group" value={selected.preferredGroup} />
            <Info label="Preferred Class" value={selected.preferredClass} />
            <Info label="SSC Board / Roll #" value={`${selected.sscBoard || '-'} / ${selected.sscRollNumber || '-'}`} />
            <Info label="SSC Marks" value={`${selected.sscObtainedMarks || '-'}/${selected.sscTotalMarks || '-'}`} />
            {selected.equivalenceBoard && (
              <>
                <Info label="Equivalence Board" value={selected.equivalenceBoard} />
                <Info label="Equivalence Marks" value={`${selected.equivalenceMarks}%`} highlight />
              </>
            )}
            <Info label="Status" value={selected.status} />
            <Info label="Created At" value={new Date(selected.createdAt).toLocaleString()} />
          </div>

          {/* Phase 8: Per-Document Verification Section */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <HiOutlineDocumentText size={16} style={{ color: '#818cf8' }} />
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Document Verification Checklist</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {standardDocs.map(doc => {
                const info = selected.docVerification?.[doc.key];
                return (
                  <div key={doc.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{doc.label}</p>
                      {info && (
                        <p style={{ fontSize: 10, color: info.ok ? '#4ade80' : '#f87171', marginTop: 2 }}>
                          {info.ok ? `✓ Verified by ${info.by || 'Registrar'} on ${new Date(info.at).toLocaleDateString()}` : `✕ Rejected: ${info.note || 'Document invalid'}`}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleVerifyDocument(doc.key, true)}
                        style={{
                          padding: '4px 8px', borderRadius: 6, border: 'none',
                          background: info?.ok ? 'rgba(74,222,128,0.25)' : 'rgba(74,222,128,0.1)',
                          color: '#4ade80', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        ✓ OK
                      </button>
                      <button
                        onClick={() => {
                          setVerifyingDoc(doc.key);
                        }}
                        style={{
                          padding: '4px 8px', borderRadius: 6, border: 'none',
                          background: info?.ok === false ? 'rgba(248,113,113,0.25)' : 'rgba(248,113,113,0.1)',
                          color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {verifyingDoc && (
              <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <p style={{ fontSize: 11, color: '#f87171', fontWeight: 600, marginBottom: 6 }}>Note for rejecting {verifyingDoc}:</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={docRejectNote}
                    onChange={e => setDocRejectNote(e.target.value)}
                    placeholder="e.g. Incomplete copy, illegible stamp..."
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--hover-bg)', color: 'var(--text-primary)', fontSize: 11 }}
                  />
                  <button
                    onClick={() => handleVerifyDocument(verifyingDoc, false, docRejectNote)}
                    style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#f87171', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => { setVerifyingDoc(null); setDocRejectNote(''); }}
                    style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-tertiary)', fontSize: 11, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {(selected.status === 'submitted' || selected.status === 'under_review') && (
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => approve(selected.id || selected._id)} className="btn-primary" style={{ fontSize: 12 }}>✅ Approve & Enroll</button>
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

      {/* ── Phase 8: Walk-In Desk Entry Modal ── */}
      {modal === 'desk' && (
        <Modal onClose={() => setModal(null)} title="New Walk-In Desk Application">
          <form onSubmit={handleDeskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Direct on-site registration by registrar staff. Will be marked as <code style={{ color: '#38bdf8' }}>source: DESK</code>.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Student Name *</label>
                <input required value={deskForm.name} onChange={e => setDeskForm({...deskForm, name: e.target.value})} className="input-field" placeholder="Full Name" style={{ fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Father Name *</label>
                <input required value={deskForm.fatherName} onChange={e => setDeskForm({...deskForm, fatherName: e.target.value})} className="input-field" placeholder="Father Name" style={{ fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Email</label>
                <input type="email" value={deskForm.email} onChange={e => setDeskForm({...deskForm, email: e.target.value})} className="input-field" placeholder="student@example.com" style={{ fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Phone *</label>
                <input required value={deskForm.phone} onChange={e => setDeskForm({...deskForm, phone: e.target.value})} className="input-field" placeholder="03XXXXXXXXX" style={{ fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Gender</label>
                <select value={deskForm.gender} onChange={e => setDeskForm({...deskForm, gender: e.target.value})} className="input-field" style={{ fontSize: 12 }}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Quota Category</label>
                <select value={deskForm.quota} onChange={e => setDeskForm({...deskForm, quota: e.target.value})} className="input-field" style={{ fontSize: 12 }}>
                  <option value="Open Merit">Open Merit</option>
                  <option value="Sports">Sports Quota</option>
                  <option value="Hafiz-e-Quran">Hafiz-e-Quran</option>
                  <option value="Faculty Child">Faculty / Staff Child</option>
                  <option value="Differently-Abled">Differently-Abled (Special Need)</option>
                  <option value="FATA/Balochistan">FATA / Balochistan Quota</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Preferred Group</label>
                <select value={deskForm.preferredGroup} onChange={e => setDeskForm({...deskForm, preferredGroup: e.target.value})} className="input-field" style={{ fontSize: 12 }}>
                  <option value="Pre-Medical">Pre-Medical</option>
                  <option value="Pre-Engineering">Pre-Engineering</option>
                  <option value="Computer Science">Computer Science (ICS)</option>
                  <option value="Commerce">Commerce (I.Com)</option>
                  <option value="Arts">Humanities / Arts (F.A)</option>
                  <option value="General Science">General Science</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Class</label>
                <select value={deskForm.preferredClass} onChange={e => setDeskForm({...deskForm, preferredClass: e.target.value})} className="input-field" style={{ fontSize: 12 }}>
                  <option value="11th">11th (1st Year)</option>
                  <option value="12th">12th (2nd Year)</option>
                </select>
              </div>
            </div>

            {/* Academic Record */}
            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Matric / SSC Board</label>
                <input value={deskForm.sscBoard} onChange={e => setDeskForm({...deskForm, sscBoard: e.target.value})} className="input-field" placeholder="BISE Lahore" style={{ fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Roll Number</label>
                <input value={deskForm.sscRollNumber} onChange={e => setDeskForm({...deskForm, sscRollNumber: e.target.value})} className="input-field" placeholder="e.g. 542109" style={{ fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Obtained Marks *</label>
                <input required type="number" value={deskForm.sscObtainedMarks} onChange={e => setDeskForm({...deskForm, sscObtainedMarks: e.target.value})} className="input-field" placeholder="980" style={{ fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Marks *</label>
                <input required type="number" value={deskForm.sscTotalMarks} onChange={e => setDeskForm({...deskForm, sscTotalMarks: e.target.value})} className="input-field" placeholder="1100" style={{ fontSize: 12 }} />
              </div>
            </div>

            {/* Equivalence Toggle */}
            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#38bdf8', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={deskForm.isEquivalence}
                  onChange={e => setDeskForm({...deskForm, isEquivalence: e.target.checked})}
                />
                Non-Pakistani Board / Equivalence Candidate (O-Levels / GCSE / IB)
              </label>
              {deskForm.isEquivalence && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Equivalence Authority / Board</label>
                    <input value={deskForm.equivalenceBoard} onChange={e => setDeskForm({...deskForm, equivalenceBoard: e.target.value})} className="input-field" placeholder="Cambridge / IBCC" style={{ fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>IBCC Equivalence Marks %</label>
                    <input type="number" step="0.1" value={deskForm.equivalenceMarks} onChange={e => setDeskForm({...deskForm, equivalenceMarks: e.target.value})} className="input-field" placeholder="e.g. 88.5" style={{ fontSize: 12 }} />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '10px 20px', marginTop: 8, fontSize: 13, fontWeight: 700 }}>
              Submit Desk Application
            </button>
          </form>
        </Modal>
      )}

      {/* ── Phase 8: Merit List & Quota Reservation Modal ── */}
      {modal === 'merit' && (
        <Modal onClose={() => setModal(null)} title="Merit List & Quota Allocation Engine">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Group:</span>
                <select
                  value={meritGroup}
                  onChange={e => {
                    setMeritGroup(e.target.value);
                    fetchMeritList(e.target.value);
                  }}
                  className="input-field"
                  style={{ fontSize: 12, width: 180 }}
                >
                  <option value="Pre-Medical">Pre-Medical</option>
                  <option value="Pre-Engineering">Pre-Engineering</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Arts">Humanities / Arts</option>
                  <option value="General Science">General Science</option>
                </select>
              </div>
              <button
                onClick={() => fetchMeritList(meritGroup)}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#8b5cf6', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                ↻ Refresh List
              </button>
            </div>

            {meritLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 30 }}>Calculating merit and quota reservations...</p>
            ) : !meritData ? (
              <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 30 }}>Select a group to calculate merit</p>
            ) : (
              <div>
                {/* Summary bar */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                    <span style={{ fontSize: 10, color: '#c084fc', textTransform: 'uppercase', fontWeight: 700 }}>Total Applicants</span>
                    <p style={{ fontSize: 18, fontWeight: 800, color: '#c084fc', margin: 0 }}>{meritData.totalApplicants || (meritData.meritList || []).length}</p>
                  </div>
                  <div style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}>
                    <span style={{ fontSize: 10, color: '#facc15', textTransform: 'uppercase', fontWeight: 700 }}>Quota Reserved</span>
                    <p style={{ fontSize: 18, fontWeight: 800, color: '#facc15', margin: 0 }}>{(meritData.quotaReserved || []).length}</p>
                  </div>
                  <div style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
                    <span style={{ fontSize: 10, color: '#4ade80', textTransform: 'uppercase', fontWeight: 700 }}>Open Merit</span>
                    <p style={{ fontSize: 18, fontWeight: 800, color: '#4ade80', margin: 0 }}>{(meritData.openMerit || []).length}</p>
                  </div>
                </div>

                {/* Combined Merit List Table */}
                <div style={{ maxHeight: 380, overflow: 'auto', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead style={{ background: 'var(--hover-bg)', position: 'sticky', top: 0 }}>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {['Rank', 'App #', 'Name', 'Category', 'Merit %', 'Scholarship Tier'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(meritData.meritList || []).map((row, idx) => (
                        <tr key={row.id || idx} style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: row.isQuota ? 'rgba(234,179,8,0.04)' : 'transparent'
                        }}>
                          <td style={{ padding: '8px 10px', fontWeight: 800, color: row.isQuota ? '#facc15' : '#818cf8' }}>
                            #{idx + 1}
                          </td>
                          <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{row.applicationNumber}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                              background: row.isQuota ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.06)',
                              color: row.isQuota ? '#facc15' : 'var(--text-secondary)'
                            }}>
                              {row.isQuota ? `Quota: ${row.quota}` : 'Open Merit'}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 800, color: '#4ade80' }}>
                            {row.meritScore || row.sscAggregate}%
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            {row.scholarshipTier ? (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}>
                                🎓 {row.scholarshipTier.name} ({row.scholarshipTier.discountPercent}% off)
                              </span>
                            ) : (
                              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Standard</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── Helpers ──
const Modal = ({ onClose, title, children }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
    <div style={{ position: 'relative', zIndex: 1, background: '#131a25', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 24, maxWidth: 680, width: '92%', maxHeight: '85vh', overflow: 'auto' }}>
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
