import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineStar } from 'react-icons/hi';

const EvaluationSeasons = () => {
  const [seasons, setSeasons] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');

  const fetch_ = async () => {
    try {
      const [s, r] = await Promise.all([
        api.get('/evaluations/seasons'),
        api.get('/evaluations/ratings')
      ]);
      setSeasons(s.data.data || []);
      setRatings(r.data.data || []);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const create = async () => {
    try {
      await api.post('/evaluations/seasons', { title: title || 'Teacher Evaluation', startDate: new Date() });
      toast.success('Evaluation announced! Students have 1 week.');
      setShowCreate(false); setTitle('');
      fetch_();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statusColors = { announced: '#38bdf8', active: '#4ade80', completed: '#818cf8', cancelled: '#f87171' };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="animate-spin" style={{ width: 28, height: 28, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} /></div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color:'var(--text-primary)' }}>⭐ Teacher Evaluations</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ fontSize: 12 }}><HiOutlinePlus size={14} style={{ display: 'inline', marginRight: 4 }} /> Announce Evaluation</button>
      </div>

      {/* Teacher Ratings */}
      {ratings.length > 0 && (
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color:'var(--text-primary)', marginBottom: 14 }}>Teacher Ratings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {ratings.map(r => (
              <div key={r.teacher_id} style={{ padding: '12px 14px', borderRadius: 8, background:'var(--hover-bg)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color:'var(--text-primary)' }}>{r.name}</p>
                  <p style={{ fontSize: 10, color:'var(--text-tertiary)' }}>{r.totalEvaluations} evaluations</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <HiOutlineStar size={16} style={{ color: '#fbbf24' }} />
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>{r.avgStars}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Season History */}
      <div className="glass-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color:'var(--text-primary)', marginBottom: 14 }}>Evaluation History</h3>
        {seasons.length === 0 ? (
          <p style={{ color:'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: 30 }}>No evaluations announced yet</p>
        ) : seasons.map(s => (
          <div key={s._id} style={{ padding: '12px 14px', borderRadius: 8, background:'var(--hover-bg)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color:'var(--text-primary)' }}>{s.title}</p>
              <p style={{ fontSize: 10, color:'var(--text-tertiary)' }}>{new Date(s.startDate).toLocaleDateString()} → {new Date(s.endDate).toLocaleDateString()}</p>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', background: `${statusColors[s.status]}15`, color: statusColors[s.status] }}>{s.status}</span>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowCreate(false)} />
          <div style={{ position: 'relative', zIndex: 1, background: '#131a25', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 24, maxWidth: 400, width: '90%' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color:'var(--text-primary)', marginBottom: 12 }}>Announce Teacher Evaluation</h3>
            <p style={{ fontSize: 12, color:'var(--text-tertiary)', marginBottom: 14 }}>Students will have 1 week to complete evaluations for all teachers.</p>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (e.g. Mid-Term Evaluation)" className="input-field" />
            <button onClick={create} className="btn-primary" style={{ width: '100%', marginTop: 12 }}>📢 Announce Now</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationSeasons;
