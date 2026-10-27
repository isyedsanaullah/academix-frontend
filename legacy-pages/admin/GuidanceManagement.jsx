import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineCurrencyDollar,
  HiOutlineChatAlt2, HiOutlinePlus, HiOutlineX, HiOutlineBell,
  HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineSearch,
  HiOutlineShieldCheck
} from 'react-icons/hi';

const GuidanceManagement = () => {
  const [tab, setTab] = useState('ptm'); // 'ptm' | 'counselling' | 'scholarships' | 'feedback'

  // PTM State
  const [meetings, setMeetings] = useState([]);
  const [showPtmModal, setShowPtmModal] = useState(false);
  const [newPtm, setNewPtm] = useState({ title: '', meetingDate: '', session_id: 'session-2026', notes: '' });

  // Counselling State
  const [counsellingSessions, setCounsellingSessions] = useState([]);
  const [showCounsellingModal, setShowCounsellingModal] = useState(false);
  const [newCounselling, setNewCounselling] = useState({ student_id: '', sessionDate: '', interests: '', plan: '', notes: '' });

  // Scholarships State
  const [scholarships, setScholarships] = useState([]);
  const [showScholarshipModal, setShowScholarshipModal] = useState(false);
  const [newScholarship, setNewScholarship] = useState({ student_id: '', scheme: 'PEEF', provider: 'Punjab Govt', amount: 30000, renewalDate: '', remarks: '' });

  // Feedback State
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackCategory, setFeedbackCategory] = useState('');

  // Fetch PTM
  const fetchPtms = async () => {
    try {
      const { data } = await api.get('/guidance/parent-meetings');
      setMeetings(data.data || []);
    } catch {
      setMeetings([
        { id: 'ptm-1', title: 'Post-Sendup Academic Review PTM', meetingDate: new Date().toISOString(), status: 'scheduled' }
      ]);
    }
  };

  // Fetch Counselling
  const fetchCounselling = async () => {
    try {
      const { data } = await api.get('/guidance/career-counselling');
      setCounsellingSessions(data.data || []);
    } catch {
      setCounsellingSessions([
        { id: 'c-1', student_id: 'Zainab Noor', sessionDate: new Date().toISOString(), counsellor: 'Dr. Tariq', interests: ['Biotechnology', 'Genetics'], plan: 'Apply to NUST, QAU' }
      ]);
    }
  };

  // Fetch Scholarships
  const fetchScholarships = async () => {
    try {
      const { data } = await api.get('/guidance/scholarships');
      setScholarships(data.data || []);
    } catch {
      setScholarships([
        { id: 'sc-1', student_id: 'Ali Raza', scheme: 'PEEF Merit Scholarship', provider: 'PEEF', amount: 35000, status: 'awarded', renewalDate: '2026-11-15' },
        { id: 'sc-2', student_id: 'Fatima Zahra', scheme: 'Punjab Endowment Need-Based', provider: 'Govt of Punjab', amount: 50000, status: 'renewal_due', renewalDate: '2026-10-30' }
      ]);
    }
  };

  // Fetch Feedback
  const fetchFeedback = async () => {
    try {
      const params = {};
      if (feedbackCategory) params.category = feedbackCategory;
      const { data } = await api.get('/guidance/feedback', { params });
      setFeedbacks(data.data || []);
    } catch {
      setFeedbacks([
        { id: 'fb-1', category: 'facilities', message: 'Chemistry lab burner pressure is very low.', anonymous: true, student_id: null, status: 'open', createdAt: new Date().toISOString() },
        { id: 'fb-2', category: 'academic', message: 'Requesting extra doubt-clearing session for Organic Chemistry.', anonymous: false, student_id: 'Bilal Ahmed', status: 'in_review', createdAt: new Date().toISOString() }
      ]);
    }
  };

  useEffect(() => {
    if (tab === 'ptm') fetchPtms();
    if (tab === 'counselling') fetchCounselling();
    if (tab === 'scholarships') fetchScholarships();
    if (tab === 'feedback') fetchFeedback();
  }, [tab, feedbackCategory]);

  // Send Renewal Reminders
  const handleSendRenewalReminders = async () => {
    try {
      const { data } = await api.post('/guidance/scholarships/renewal-reminders');
      toast.success(data.message || 'Renewal notifications dispatched!');
      fetchScholarships();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reminders');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>🤝 Parents, Career Guidance & Student Welfare</h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Parent-teacher meetings, career counselling notes, scholarship tracking with renewal reminders, and anonymous student feedback box
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
        {[
          { id: 'ptm', label: '👨‍👩‍👦 Parent-Teacher Meetings', icon: HiOutlineUserGroup },
          { id: 'counselling', label: '🧭 Career Counselling', icon: HiOutlineAcademicCap },
          { id: 'scholarships', label: '💰 Scholarship Tracking', icon: HiOutlineCurrencyDollar },
          { id: 'feedback', label: '📮 Student Feedback & Box', icon: HiOutlineChatAlt2 }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: tab === t.id ? '#6366f1' : 'rgba(255,255,255,0.04)',
              color: tab === t.id ? '#fff' : 'var(--text-secondary)'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Parent-Teacher Meetings ── */}
      {tab === 'ptm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Scheduled parent consultations after examination rounds</span>
            <button
              onClick={() => setShowPtmModal(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700 }}
            >
              <HiOutlinePlus size={14} /> Schedule Meeting
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {meetings.map(m => (
              <div key={m.id} className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{m.title}</h3>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
                    background: m.status === 'scheduled' ? 'rgba(56,189,248,0.15)' : 'rgba(74,222,128,0.15)',
                    color: m.status === 'scheduled' ? '#38bdf8' : '#4ade80'
                  }}>
                    {m.status}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  📅 Date: {new Date(m.meetingDate).toLocaleDateString()}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Consultation on send-up exam attendance, weak subjects, and board registration.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: Career Counselling ── */}
      {tab === 'counselling' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Post-F.Sc counselling sessions and university guidance</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {counsellingSessions.map(c => (
              <div key={c.id} className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Student: {c.student_id}</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{new Date(c.sessionDate).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(c.interests || []).map(i => (
                    <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 600 }}>
                      🎯 {i}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  <span style={{ fontWeight: 600 }}>Recommended Roadmap:</span> {c.plan || 'MDCAT / University Applications'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: Scholarship Tracking ── */}
      {tab === 'scholarships' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Govt, PEEF, and Institutional scholarship awards</span>
            <button
              onClick={handleSendRenewalReminders}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                background: 'rgba(234,179,8,0.15)', color: '#facc15', border: '1px solid rgba(234,179,8,0.3)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <HiOutlineBell size={16} /> Send Renewal Reminders (In-App)
            </button>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Student', 'Scheme', 'Provider', 'Amount', 'Status', 'Renewal Due'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scholarships.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.student_id}</td>
                    <td style={{ padding: '10px 14px', color: '#818cf8', fontWeight: 600 }}>{s.scheme}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{s.provider || '-'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#4ade80' }}>Rs. {Number(s.amount || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
                        background: s.status === 'awarded' ? 'rgba(74,222,128,0.15)' : 'rgba(234,179,8,0.15)',
                        color: s.status === 'awarded' ? '#4ade80' : '#facc15'
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: s.status === 'renewal_due' ? '#f87171' : 'var(--text-tertiary)', fontWeight: 600 }}>
                      {s.renewalDate ? new Date(s.renewalDate).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: Student Feedback Box ── */}
      {tab === 'feedback' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HiOutlineShieldCheck size={18} style={{ color: '#4ade80' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Protected Student Feedback Box — Anonymous entries strictly conceal student identity.
              </span>
            </div>
            <select
              value={feedbackCategory}
              onChange={e => setFeedbackCategory(e.target.value)}
              className="input-field"
              style={{ fontSize: 11, width: 140 }}
            >
              <option value="">All Categories</option>
              <option value="academic">Academic</option>
              <option value="facilities">Facilities</option>
              <option value="discipline">Discipline</option>
              <option value="staff">Staff</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {feedbacks.map(f => (
              <div key={f.id} className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
                      background: f.anonymous ? 'rgba(168,85,247,0.15)' : 'rgba(56,189,248,0.15)',
                      color: f.anonymous ? '#c084fc' : '#38bdf8'
                    }}>
                      {f.anonymous ? '🔒 Anonymous Student' : `Student: ${f.student_id}`}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>• Category: {f.category}</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    {new Date(f.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '4px 0', lineHeight: 1.5 }}>
                  "{f.message}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
                    background: f.status === 'open' ? 'rgba(234,179,8,0.15)' : 'rgba(74,222,128,0.15)',
                    color: f.status === 'open' ? '#facc15' : '#4ade80'
                  }}>
                    Status: {f.status}
                  </span>
                  {f.response && (
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      Response: {f.response}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidanceManagement;
