import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlinePlus, HiOutlinePencil, HiOutlineX, HiOutlineGlobe } from 'react-icons/hi';

const STATUS_OPTIONS = [
  { value: 'draft', label: '📝 Draft — Not visible to public', desc: 'Season is being prepared. Students cannot see or apply yet.' },
  { value: 'open', label: '🟢 Open — Accepting Applications', desc: 'Students can see this on the public page and submit applications.' },
  { value: 'closed', label: '🔴 Closed — No longer accepting', desc: 'Deadline passed or seats filled. Public page shows "Admissions Closed".' },
  { value: 'completed', label: '✅ Completed — All done', desc: 'Admission process is finished. Results announced. Archived.' }
];

const AdmissionSeasons = () => {
  const [seasons, setSeasons] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', session_id: '', startDate: '', endDate: '',
    availableGroups: ['Pre-Medical', 'Pre-Engineering', 'Computer Science'],
    availableClasses: ['FSC Part 1'],
    entryTestRequired: false, entryTestDate: '', entryTestVenue: '',
    minAggregate: 0, maxSeats: 100, status: 'draft', instructions: ''
  });

  const fetchData = async () => {
    try {
      const [sRes, sessRes] = await Promise.all([
        api.get('/registrar/seasons'),
        api.get('/sessions')
      ]);
      setSeasons(sRes.data.data || []);
      setSessions(sessRes.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', description: '', session_id: sessions[0]?._id || '', startDate: '', endDate: '', availableGroups: ['Pre-Medical', 'Pre-Engineering', 'Computer Science'], availableClasses: ['FSC Part 1'], entryTestRequired: false, entryTestDate: '', entryTestVenue: '', minAggregate: 0, maxSeats: 100, status: 'draft', instructions: '' });
    setModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ ...s, session_id: s.session_id?._id || s.session_id, startDate: s.startDate?.slice(0, 10), endDate: s.endDate?.slice(0, 10), entryTestDate: s.entryTestDate?.slice(0, 10) || '' });
    setModal(true);
  };

  const save = async () => {
    try {
      let savedSeason;
      if (editing) {
        const res = await api.put(`/registrar/seasons/${editing._id}`, form);
        savedSeason = res.data.data;
        toast.success('Season updated');
      } else {
        const res = await api.post('/registrar/seasons', form);
        savedSeason = res.data.data;
        toast.success('Season created');
      }

      // Auto-create a public announcement when status is set to 'open'
      const wasOpen = editing?.status === 'open';
      if (form.status === 'open' && !wasOpen) {
        try {
          await api.post('/announcements', {
            title: `🎓 ${form.title || 'Admissions Open'}`,
            content: `${form.description || 'New admission season is now open!'} Apply before ${new Date(form.endDate).toLocaleDateString()}. Groups: ${(form.availableGroups || []).join(', ')}. Max seats: ${form.maxSeats || 'Limited'}.`,
            category: 'admission',
            audience: 'all',
            isPublic: true,
            priority: 'high'
          });
          toast.success('Public announcement created automatically!');
        } catch (annErr) {
          console.error('Auto-announcement failed:', annErr);
          toast('Season opened but auto-announcement failed. Create one manually from Announcements page.', { icon: '⚠️' });
        }
      }

      setModal(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const toggleGroup = (g) => {
    setForm(f => ({
      ...f,
      availableGroups: f.availableGroups.includes(g)
        ? f.availableGroups.filter(x => x !== g)
        : [...f.availableGroups, g]
    }));
  };

  const statusColor = { draft: '#94a3b8', open: '#4ade80', closed: '#f87171', completed: '#818cf8' };
  const statusLabel = { draft: 'Draft', open: 'Open — Live', closed: 'Closed', completed: 'Completed' };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} /></div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color:'var(--text-primary)' }}>📅 Admission Seasons</h1>
        <button onClick={openNew} className="btn-primary" style={{ fontSize: 12 }}><HiOutlinePlus size={14} style={{ display: 'inline', marginRight: 4 }} /> New Season</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {seasons.length === 0 ? (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color:'var(--text-tertiary)' }}>No admission seasons created yet</div>
        ) : seasons.map(s => (
          <div key={s._id} className="glass-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HiOutlineCalendar size={16} style={{ color: '#818cf8' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color:'var(--text-primary)' }}>{s.title}</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${statusColor[s.status]}15`, color: statusColor[s.status], textTransform: 'uppercase' }}>{statusLabel[s.status] || s.status}</span>
              </div>
              <p style={{ fontSize: 11, color:'var(--text-tertiary)', marginTop: 4 }}>
                {new Date(s.startDate).toLocaleDateString()} — {new Date(s.endDate).toLocaleDateString()} • {s.availableGroups?.join(', ')} • Max: {s.maxSeats} seats
                {s.entryTestRequired && ' • Entry Test Required'}
              </p>
              <p style={{ fontSize: 10, color:'var(--text-tertiary)', marginTop: 2 }}>
                Session: {s.session_id?.name || '-'} • Public link: <span style={{ color: '#818cf8' }}>/apply/VITAL</span>
              </p>
            </div>
            <button onClick={() => openEdit(s)} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background:'var(--hover-bg)', color:'var(--text-tertiary)', cursor: 'pointer' }}><HiOutlinePencil size={14} /></button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setModal(false)} />
          <div style={{ position: 'relative', zIndex: 1, background: '#131a25', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 24, maxWidth: 550, width: '90%', maxHeight: '85vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color:'var(--text-primary)' }}>{editing ? 'Edit Season' : 'New Admission Season'}</h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color:'var(--text-tertiary)', cursor: 'pointer' }}><HiOutlineX size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Title (e.g. Admissions 2026-27)" className="input-field" />
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" rows={2} className="input-field" style={{ resize: 'none' }} />
              <select value={form.session_id} onChange={e => setForm({...form, session_id: e.target.value})} className="input-field">
                {sessions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={{ fontSize: 10, color:'var(--text-tertiary)', fontWeight: 600 }}>Start Date</label><input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="input-field" /></div>
                <div><label style={{ fontSize: 10, color:'var(--text-tertiary)', fontWeight: 600 }}>End Date</label><input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="input-field" /></div>
              </div>

              {/* Groups */}
              <div>
                <label style={{ fontSize: 10, color:'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Available Groups</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Pre-Medical', 'Pre-Engineering', 'Computer Science'].map(g => (
                    <button key={g} type="button" onClick={() => toggleGroup(g)} style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                      background: form.availableGroups.includes(g) ? 'rgba(99,102,241,0.15)' : 'transparent',
                      borderColor: form.availableGroups.includes(g) ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)',
                      color: form.availableGroups.includes(g) ? '#818cf8' : 'rgba(255,255,255,0.3)'
                    }}>{g}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={{ fontSize: 10, color:'var(--text-tertiary)', fontWeight: 600 }}>Min Aggregate %</label><input type="number" value={form.minAggregate} onChange={e => setForm({...form, minAggregate: Number(e.target.value)})} className="input-field" /></div>
                <div><label style={{ fontSize: 10, color:'var(--text-tertiary)', fontWeight: 600 }}>Max Seats</label><input type="number" value={form.maxSeats} onChange={e => setForm({...form, maxSeats: Number(e.target.value)})} className="input-field" /></div>
              </div>

              {/* Entry Test */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.entryTestRequired} onChange={e => setForm({...form, entryTestRequired: e.target.checked})} />
                <span style={{ fontSize: 12, color:'var(--text-secondary)' }}>Entry Test Required</span>
              </label>
              {form.entryTestRequired && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={{ fontSize: 10, color:'var(--text-tertiary)', fontWeight: 600 }}>Test Date</label><input type="date" value={form.entryTestDate} onChange={e => setForm({...form, entryTestDate: e.target.value})} className="input-field" /></div>
                  <div><label style={{ fontSize: 10, color:'var(--text-tertiary)', fontWeight: 600 }}>Venue</label><input value={form.entryTestVenue} onChange={e => setForm({...form, entryTestVenue: e.target.value})} placeholder="Main Hall" className="input-field" /></div>
                </div>
              )}

              {/* Admission Status — determines public visibility */}
              <div>
                <label style={{ fontSize: 10, color:'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Admission Status (controls public visibility)</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-field">
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <p style={{ fontSize: 10, color: statusColor[form.status] || 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.5, padding: '6px 10px', borderRadius: 6, background: `${statusColor[form.status] || '#94a3b8'}08`, border: `1px solid ${statusColor[form.status] || '#94a3b8'}15` }}>
                  {STATUS_OPTIONS.find(s => s.value === form.status)?.desc}
                </p>
                {form.status === 'open' && (!editing || editing.status !== 'open') && (
                  <p style={{ fontSize: 10, color: '#4ade80', marginTop: 6, padding: '6px 10px', borderRadius: 6, background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.1)' }}>
                    ✨ A public announcement will be created automatically when you save with "Open" status. Students will be able to apply at <strong>/apply/VITAL</strong>
                  </p>
                )}
              </div>

              <textarea value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} placeholder="Instructions for applicants (optional)" rows={2} className="input-field" style={{ resize: 'none' }} />

              <button onClick={save} className="btn-primary">{editing ? 'Update Season' : 'Create Season'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionSeasons;
