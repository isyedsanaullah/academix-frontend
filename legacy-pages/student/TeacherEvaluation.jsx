import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineStar, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi';

const TeacherEvaluation = () => {
  const [teachers, setTeachers] = useState([]);
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evalModal, setEvalModal] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetch_ = async () => {
    try {
      const { data } = await api.get('/evaluations/my');
      setTeachers(data.data || []);
      setSeason(data.season);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const startEval = async (teacher) => {
    try {
      const { data } = await api.get('/evaluations/questions');
      setQuestions(data.data);
      setAnswers(data.data.map(() => ''));
      setEvalModal(teacher);
    } catch { toast.error('Failed to load questions'); }
  };

  const submit = async () => {
    if (answers.some(a => !a)) return toast.error('Answer all questions');
    setSubmitting(true);
    try {
      const payload = {
        teacher_id: evalModal.teacher_id,
        questions: questions.map((q, i) => ({ question: q, answer: answers[i] }))
      };
      const { data } = await api.post('/evaluations/submit', payload);
      toast.success(`Evaluation submitted! ${data.data.stars} ⭐`);
      setEvalModal(null);
      fetch_();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const answerColors = { good: '#4ade80', bad: '#f87171', neutral: '#fbbf24' };
  const answerLabels = { good: '👍 Good', bad: '👎 Bad', neutral: '😐 Neutral' };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="animate-spin" style={{ width: 28, height: 28, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} /></div>;

  if (!season) return (
    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <HiOutlineClock size={48} style={{ color:'var(--text-tertiary)', margin: '0 auto 16px' }} />
      <h2 style={{ fontSize: 20, fontWeight: 700, color:'var(--text-tertiary)' }}>No Active Evaluation</h2>
      <p style={{ fontSize: 13, color:'var(--text-tertiary)', marginTop: 8 }}>Teacher evaluation has not been announced yet</p>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color:'var(--text-primary)' }}>⭐ Teacher Evaluation</h1>
      </div>

      <div style={{ padding: '14px 18px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#818cf8' }}>{season.title}</p>
        <p style={{ fontSize: 11, color:'var(--text-tertiary)', marginTop: 4 }}>
          Deadline: {new Date(season.endDate).toLocaleDateString()} • Evaluate all your teachers
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {teachers.map(t => (
          <div key={t.teacher_id} className="glass-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color:'var(--text-primary)' }}>{t.name}</p>
                <p style={{ fontSize: 11, color:'var(--text-tertiary)', marginTop: 4 }}>{t.subject}</p>
              </div>
              {t.completed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'rgba(74,222,128,0.1)' }}>
                  <HiOutlineCheckCircle size={14} style={{ color: '#4ade80' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#4ade80' }}>Done</span>
                </div>
              ) : (
                <button onClick={() => startEval(t)} style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'var(--text-primary)'
                }}>Evaluate</button>
              )}
            </div>
            {t.completed && (
              <div style={{ marginTop: 10, display: 'flex', gap: 2 }}>
                {[1,2,3,4,5].map(s => (
                  <HiOutlineStar key={s} size={16} style={{ color: s <= t.stars ? '#fbbf24' : 'rgba(255,255,255,0.1)' }} />
                ))}
                <span style={{ fontSize: 11, color:'var(--text-tertiary)', marginLeft: 6 }}>{t.stars}/5</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Evaluation Modal */}
      {evalModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={() => setEvalModal(null)} />
          <div style={{ position: 'relative', zIndex: 1, background: '#131a25', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 24, maxWidth: 600, width: '95%', maxHeight: '85vh', overflow: 'auto' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color:'var(--text-primary)', marginBottom: 4 }}>Evaluate: {evalModal.name}</h3>
            <p style={{ fontSize: 11, color:'var(--text-tertiary)', marginBottom: 16 }}>{evalModal.subject} • 15 Questions • 3 good = 1 ⭐</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {questions.map((q, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background:'var(--hover-bg)', border:'1px solid var(--border-color)' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color:'var(--text-primary)', marginBottom: 8 }}>{i+1}. {q}</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['good', 'neutral', 'bad'].map(opt => (
                      <button key={opt} onClick={() => { const a = [...answers]; a[i] = opt; setAnswers(a); }}
                        style={{
                          flex: 1, padding: '7px 0', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                          background: answers[i] === opt ? `${answerColors[opt]}12` : 'transparent',
                          borderColor: answers[i] === opt ? `${answerColors[opt]}40` : 'rgba(255,255,255,0.08)',
                          color: answers[i] === opt ? answerColors[opt] : 'rgba(255,255,255,0.25)'
                        }}>{answerLabels[opt]}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>
                Good answers: {answers.filter(a => a === 'good').length}/15 → {Math.min(5, Math.floor(answers.filter(a => a === 'good').length / 3))} ⭐
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setEvalModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color:'var(--text-tertiary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Cancel</button>
              <button onClick={submit} disabled={submitting} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'var(--text-primary)', cursor: 'pointer', fontSize: 12, fontWeight: 700, opacity: submitting ? 0.5 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherEvaluation;
