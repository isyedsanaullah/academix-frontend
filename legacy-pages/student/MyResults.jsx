import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MyResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/results/my');
        setResults(data.data || []);
      } catch { toast.error('Failed to load results'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 800, color:'var(--text-primary)' }}>My Results</h1>

      {results.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color:'var(--text-tertiary)', fontSize: '13px' }}>
          No results available yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {results.map(r => (
            <div key={r._id} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color:'var(--text-primary)' }}>{r.exam_id?.name || 'Exam'}</h3>
                  <p style={{ fontSize: '11px', color:'var(--text-tertiary)', marginTop: '2px' }}>{r.exam_id?.class}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: r.grade === 'F' ? '#f87171' : r.percentage >= 70 ? '#4ade80' : '#fbbf24' }}>{r.percentage}%</p>
                  <span className={`badge ${r.grade === 'F' ? 'badge-danger' : r.percentage >= 70 ? 'badge-success' : 'badge-warning'}`}>{r.grade} — {r.grade === 'F' ? 'FAIL' : 'PASS'}</span>
                </div>
              </div>

              {/* Subject breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {r.marks?.map((m, i) => {
                  const pct = m.total > 0 ? (m.obtained / m.total) * 100 : 0;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: '8px', background:'var(--hover-bg)',
                    }}>
                      <span style={{ fontSize: '12px', color:'var(--text-secondary)' }}>{m.subject}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '60px', height: '3px', background:'var(--hover-bg)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 50 ? '#4ade80' : '#f87171', borderRadius: '99px' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color:'var(--text-primary)', minWidth: '50px', textAlign: 'right' }}>{m.obtained}/{m.total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop:'1px solid var(--border-color)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color:'var(--text-secondary)' }}>Total: {r.totalObtained}/{r.totalMarks}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyResults;
