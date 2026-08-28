import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSparkles, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineClipboardList } from 'react-icons/hi';

const lbl = { fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 };

const TeacherAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [gradingId, setGradingId] = useState(null);
  const [batchGradingId, setBatchGradingId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', instructions: '', dueDate: '', totalMarks: 10, submissionType: 'both', session_id: '', class_id: '', section_id: '', subject_id: '' });
  const [meta, setMeta] = useState({ classes: [], sections: [], subjects: [], sessions: [] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [aRes, cRes, secRes, subRes, sesRes] = await Promise.all([
        api.get('/assignments'), api.get('/classes').catch(() => ({ data: { data: [] } })),
        api.get('/sections').catch(() => ({ data: { data: [] } })),
        api.get('/subjects').catch(() => ({ data: { data: [] } })),
        api.get('/sessions').catch(() => ({ data: { data: [] } })),
      ]);
      setAssignments(aRes.data.data || []);
      setMeta({ classes: cRes.data.data || [], sections: secRes.data.data || [], subjects: subRes.data.data || [], sessions: sesRes.data.data || [] });
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.dueDate) return toast.error('Title and due date required');
    setSubmitting(true);
    try { await api.post('/assignments', form); toast.success('Assignment created'); setShowCreate(false); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleAiGrade = async (aId, sId) => {
    setGradingId(`${aId}-${sId}`);
    try { await api.post(`/assignments/${aId}/ai-grade`, { student_id: sId }); toast.success('AI grading complete'); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'AI grading failed'); }
    finally { setGradingId(null); }
  };

  const handleBatchGrade = async (aId) => {
    setBatchGradingId(aId);
    try { const { data } = await api.post(`/assignments/${aId}/ai-batch-grade`); toast.success(`${data.graded} graded`); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Batch failed'); }
    finally { setBatchGradingId(null); }
  };

  const handleManualGrade = async (aId, sId, marks) => {
    try { await api.post(`/assignments/${aId}/grade`, { student_id: sId, obtainedMarks: marks }); toast.success('Saved'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}><div className="animate-spin" style={{ width: 32, height: 32, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} /></div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>📝 Assignments</h1>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Create institutional assignments, view submissions & AI auto-grade</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowCreate(!showCreate)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color:'var(--text-primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <HiOutlinePlus size={16} /> Quick Create
          </button>
          <a href="/teacher/ai/assignment" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'var(--text-primary)', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', textDecoration: 'none' }}>
            <HiOutlineSparkles size={16} /> AI Assignment Authoring Studio
          </a>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="glass-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>📋 Create Assignment</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Title *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="form-input" /></div>
            <div><label style={lbl}>Class</label><select value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})} className="form-input"><option value="">Select</option>{meta.classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
            <div><label style={lbl}>Subject</label><select value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})} className="form-input"><option value="">Select</option>{meta.subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
            <div><label style={lbl}>Due Date *</label><input type="datetime-local" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} required className="form-input" /></div>
            <div><label style={lbl}>Total Marks</label><input type="number" value={form.totalMarks} onChange={e => setForm({...form, totalMarks: parseInt(e.target.value)})} min={1} className="form-input" /></div>
            <div><label style={lbl}>Submission Type</label><select value={form.submissionType} onChange={e => setForm({...form, submissionType: e.target.value})} className="form-input"><option value="both">Both</option><option value="handwritten">✍️ Handwritten</option><option value="typed">⌨️ Typed</option></select></div>
            <div><label style={lbl}>Section</label><select value={form.section_id} onChange={e => setForm({...form, section_id: e.target.value})} className="form-input"><option value="">All</option>{meta.sections.map(s => <option key={s._id} value={s._id}>{s.code||s.name}</option>)}</select></div>
          </div>
          <div style={{ marginTop: 14 }}><label style={lbl}>Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="form-input" /></div>
          <div style={{ marginTop: 14 }}><label style={lbl}>Instructions</label><textarea value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} rows={2} className="form-input" /></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ padding: '8px 24px', borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'var(--text-primary)', fontWeight: 600, fontSize: 12, border: 'none', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      )}

      {assignments.length === 0 ? (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}><HiOutlineClipboardList size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} /><p style={{ color: 'var(--text-tertiary)' }}>No assignments</p></div>
      ) : assignments.map(a => <AssignmentCard key={a._id} a={a} expanded={expandedId === a._id} onToggle={() => setExpandedId(expandedId === a._id ? null : a._id)} onAiGrade={handleAiGrade} onBatchGrade={handleBatchGrade} onManualGrade={handleManualGrade} gradingId={gradingId} batchGradingId={batchGradingId} />)}
    </div>
  );
};

const AssignmentCard = ({ a, expanded, onToggle, onAiGrade, onBatchGrade, onManualGrade, gradingId, batchGradingId }) => {
  const submitted = a.submissions?.length || 0;
  const graded = a.submissions?.filter(s => s.status === 'graded' || s.status === 'ai-graded').length || 0;
  const past = new Date(a.dueDate) < new Date();

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 12 }} onClick={onToggle}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{a.title}</h3>
            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: past ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.12)', color: past ? '#f87171' : '#4ade80' }}>{past ? 'CLOSED' : 'ACTIVE'}</span>
            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{a.submissionType === 'handwritten' ? '✍️' : a.submissionType === 'typed' ? '⌨️' : '📄'} {a.submissionType}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
            <span>{a.subject_id?.name || '—'}</span><span>•</span>
            <span>Due: {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span><span>•</span>
            <span>Marks: {a.totalMarks}</span><span>•</span><span>{submitted} submitted, {graded} graded</span>
          </div>
        </div>
        {expanded ? <HiOutlineChevronUp size={18} style={{ color: 'var(--text-tertiary)' }} /> : <HiOutlineChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} />}
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-color)' }}>
          {a.description && <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', fontSize: 12, color: 'var(--text-secondary)' }}><b>Description:</b> {a.description}{a.instructions && <><br/><b>Instructions:</b> {a.instructions}</>}</div>}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => onBatchGrade(a._id)} disabled={batchGradingId === a._id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color:'var(--text-primary)', fontWeight: 600, fontSize: 11, border: 'none', cursor: 'pointer', opacity: batchGradingId === a._id ? 0.6 : 1 }}>
              <HiOutlineSparkles size={14} /> {batchGradingId === a._id ? 'Grading...' : 'AI Grade All (max 5)'}
            </button>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Saves tokens by grading 5 at a time</span>
          </div>
          {(!a.submissions || a.submissions.length === 0) ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>No submissions</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>{['Student', 'Submitted', 'Status', 'Marks', 'AI Marks', 'AI Feedback', 'AI Generated?', 'Missing', 'Action'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 9, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {a.submissions.map(sub => {
                    const isG = gradingId === `${a._id}-${sub.student_id?._id}`;
                    return (
                      <tr key={sub._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{sub.student_id?.name||'—'}<br/><span style={{fontSize:9,color:'var(--text-tertiary)'}}>{sub.student_id?.rollNumber||''}</span></td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-tertiary)', fontSize: 10 }}>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}</td>
                        <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: sub.status === 'graded' ? 'rgba(74,222,128,0.12)' : sub.status === 'ai-graded' ? 'rgba(139,92,246,0.12)' : 'rgba(251,191,36,0.12)', color: sub.status === 'graded' ? '#4ade80' : sub.status === 'ai-graded' ? '#a78bfa' : '#fbbf24' }}>{sub.status}</span></td>
                        <td style={{ padding: '10px 12px' }}><input type="number" min={0} max={a.totalMarks} defaultValue={sub.obtainedMarks??''} style={{ width: 45, padding: '2px 4px', borderRadius: 4, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 11 }} onBlur={e => { const v = parseInt(e.target.value); if (!isNaN(v)) onManualGrade(a._id, sub.student_id?._id, v); }} /><span style={{ color: 'var(--text-tertiary)', fontSize: 9 }}>/{a.totalMarks}</span></td>
                        <td style={{ padding: '10px 12px', color: sub.aiMarks != null ? '#a78bfa' : 'var(--text-tertiary)', fontWeight: 600 }}>{sub.aiMarks != null ? `${sub.aiMarks}/${a.totalMarks}` : '—'}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', maxWidth: 160, fontSize: 10 }}>{sub.aiFeedback || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>{sub.aiIsGenerated == null ? '—' : sub.aiIsGenerated ? <span style={{ color: '#f87171', fontSize: 10, fontWeight: 700 }}>⚠️ AI ({sub.aiConfidence}%)</span> : <span style={{ color: '#4ade80', fontSize: 10, fontWeight: 700 }}>✅ Human</span>}</td>
                        <td style={{ padding: '10px 12px', fontSize: 10, color: 'var(--text-tertiary)' }}>{sub.aiMissingPoints?.length ? <ul style={{ margin: 0, paddingLeft: 14 }}>{sub.aiMissingPoints.map((p,i) => <li key={i}>{p}</li>)}</ul> : '—'}</td>
                        <td style={{ padding: '10px 12px' }}><button onClick={() => onAiGrade(a._id, sub.student_id?._id)} disabled={isG} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa', fontSize: 10, fontWeight: 600, cursor: 'pointer', opacity: isG ? 0.5 : 1 }}><HiOutlineSparkles size={12} />{isG ? '...' : 'AI'}</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;
