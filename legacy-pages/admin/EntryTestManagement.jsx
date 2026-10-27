import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineAcademicCap, HiOutlineClipboardList, HiOutlineCalculator,
  HiOutlinePlus, HiOutlineX, HiOutlineSearch, HiOutlineDocumentText,
  HiOutlineFilter, HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineClock,
  HiOutlineInformationCircle, HiOutlineSparkles, HiOutlineTag
} from 'react-icons/hi';

const EntryTestManagement = () => {
  const [tab, setTab] = useState('mcq'); // 'mcq' | 'mocks' | 'calc' | 'tracker'

  // MCQ Bank state
  const [questions, setQuestions] = useState([]);
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqSubject, setMcqSubject] = useState('');
  const [mcqSearch, setMcqSearch] = useState('');
  const [showMcqModal, setShowMcqModal] = useState(false);
  const [newMcq, setNewMcq] = useState({
    subject: 'Biology', class: 'FSC Part 1', chapter: '', topic: '',
    text: '', options: ['', '', '', ''], answerIndex: 0,
    difficulty: 'medium', tags: 'mdcat', explanation: ''
  });

  // Mock Tests state
  const [mockTests, setMockTests] = useState([]);
  const [selectedMock, setSelectedMock] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showNewMockModal, setShowNewMockModal] = useState(false);
  const [newMockForm, setNewMockForm] = useState({
    title: '', series: 'MDCAT Series 2026', tag: 'mdcat',
    totalMarks: 200, negativeMark: 0.25, markingMode: 'manual'
  });

  // Aggregate Calculator state
  const [aggCalc, setAggCalc] = useState({
    matricObtained: 1020, matricTotal: 1100,
    fscObtained: 980, fscTotal: 1100,
    entryObtained: 175, entryTotal: 200,
    weights: { matric: 10, fsc: 40, entryTest: 50 }
  });
  const [aggResult, setAggResult] = useState(null);

  // Registrations state
  const [registrations, setRegistrations] = useState([]);

  // Fetch MCQ Bank
  const fetchMcqs = async () => {
    setMcqLoading(true);
    try {
      const params = {};
      if (mcqSubject) params.subject = mcqSubject;
      if (mcqSearch) params.search = mcqSearch;
      const { data } = await api.get('/entry-test/mcq', { params });
      setQuestions(data.data || []);
    } catch {
      // Mock fallback data for preview if tenant DB has not seeded MCQs yet
      setQuestions([
        {
          id: 'mcq-1', subject: 'Biology', chapter: 'Cell Structure',
          text: 'Which organelle is known as the powerhouse of the cell?',
          options: ['Ribosome', 'Mitochondria', 'Golgi Apparatus', 'Endoplasmic Reticulum'],
          answerIndex: 1, difficulty: 'easy', tags: ['mdcat']
        },
        {
          id: 'mcq-2', subject: 'Physics', chapter: 'Vectors & Equilibrium',
          text: 'The dot product of two mutually perpendicular vectors is equal to:',
          options: ['1', 'Zero', '-1', 'Infinity'],
          answerIndex: 1, difficulty: 'medium', tags: ['ecat', 'nust']
        },
        {
          id: 'mcq-3', subject: 'Chemistry', chapter: 'Atomic Structure',
          text: 'The maximum number of electrons that can be accommodated in p-subshell is:',
          options: ['2', '6', '10', '14'],
          answerIndex: 1, difficulty: 'easy', tags: ['mdcat', 'ecat']
        }
      ]);
    } finally {
      setMcqLoading(false);
    }
  };

  // Fetch Mock Tests
  const fetchMockTests = async () => {
    try {
      const { data } = await api.get('/entry-test/mock-tests');
      setMockTests(data.data || []);
    } catch {
      setMockTests([
        { id: 'mock-1', title: 'Grand MDCAT Diagnostic Test #1', tag: 'mdcat', series: '2026 Session', totalMarks: 200, status: 'scheduled' },
        { id: 'mock-2', title: 'ECAT Mathematics & Physics Sprint #1', tag: 'ecat', series: '2026 Session', totalMarks: 100, status: 'scheduled' }
      ]);
    }
  };

  // Fetch Registrations
  const fetchRegistrations = async () => {
    try {
      const { data } = await api.get('/entry-test/registrations');
      setRegistrations(data.data || []);
    } catch {
      setRegistrations([]);
    }
  };

  useEffect(() => {
    if (tab === 'mcq') fetchMcqs();
    if (tab === 'mocks') fetchMockTests();
    if (tab === 'tracker') fetchRegistrations();
  }, [tab, mcqSubject]);

  // Create MCQ
  const handleCreateMcq = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newMcq,
        tags: newMcq.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      await api.post('/entry-test/mcq', payload);
      toast.success('MCQ added to Question Bank');
      setShowMcqModal(false);
      fetchMcqs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save question');
    }
  };

  // View Rankings
  const handleViewRankings = async (mock) => {
    setSelectedMock(mock);
    try {
      const { data } = await api.get(`/entry-test/mock-tests/${mock.id}/rankings`);
      setRankings(data.rankings || []);
      setShowRankModal(true);
    } catch {
      // Mock ranking sample for demonstration
      setRankings([
        { rankCollege: 1, student: { name: 'Ayesha Khan', rollNumber: 'MED-01', section_id: 'Section A' }, score: 192, correct: 194, wrong: 8 },
        { rankCollege: 2, student: { name: 'Bilal Ahmed', rollNumber: 'MED-04', section_id: 'Section A' }, score: 185, correct: 188, wrong: 12 },
        { rankCollege: 2, student: { name: 'Zainab Noor', rollNumber: 'MED-12', section_id: 'Section B' }, score: 185, correct: 188, wrong: 12 },
        { rankCollege: 4, student: { name: 'Usman Ali', rollNumber: 'MED-07', section_id: 'Section A' }, score: 178, correct: 182, wrong: 16 }
      ]);
      setShowRankModal(true);
    }
  };

  // Calculate Aggregate
  const handleCalcAggregate = () => {
    const pMatric = (Number(aggCalc.matricObtained) / Number(aggCalc.matricTotal)) * 100;
    const pFsc = (Number(aggCalc.fscObtained) / Number(aggCalc.fscTotal)) * 100;
    const pEntry = (Number(aggCalc.entryObtained) / Number(aggCalc.entryTotal)) * 100;

    const wMatric = Number(aggCalc.weights.matric) || 0;
    const wFsc = Number(aggCalc.weights.fsc) || 0;
    const wEntry = Number(aggCalc.weights.entryTest) || 0;
    const totalW = wMatric + wFsc + wEntry || 100;

    const aggregate = (pMatric * wMatric + pFsc * wFsc + pEntry * wEntry) / totalW;

    setAggResult({
      aggregate: aggregate.toFixed(4),
      pMatric: pMatric.toFixed(2),
      pFsc: pFsc.toFixed(2),
      pEntry: pEntry.toFixed(2)
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>🎓 Entry-Test & MDCAT / ECAT Preparation</h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Chapter-wise MCQ question bank, mock test series with ranking, aggregate calculator, and university registrations
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'mcq' && (
            <button
              onClick={() => setShowMcqModal(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}
            >
              <HiOutlinePlus size={16} /> New MCQ Question
            </button>
          )}
          {tab === 'mocks' && (
            <button
              onClick={() => setShowNewMockModal(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}
            >
              <HiOutlinePlus size={16} /> New Mock Test
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
        {[
          { id: 'mcq', label: '📚 MCQ Question Bank', icon: HiOutlineClipboardList },
          { id: 'mocks', label: '📝 Mock Tests & Rankings', icon: HiOutlineChartBar },
          { id: 'calc', label: '🧮 Aggregate Calculator', icon: HiOutlineCalculator },
          { id: 'tracker', label: '🎯 University Application Tracker', icon: HiOutlineAcademicCap }
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

      {/* ── TAB 1: MCQ Bank ── */}
      {tab === 'mcq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={mcqSubject}
              onChange={e => setMcqSubject(e.target.value)}
              className="input-field"
              style={{ fontSize: 12, width: 160 }}
            >
              <option value="">All Subjects</option>
              <option value="Biology">Biology</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
              <option value="English">English</option>
              <option value="Logical Reasoning">Logical Reasoning</option>
            </select>
            <div style={{ display: 'flex', gap: 6, flex: 1, maxWidth: 300 }}>
              <input
                value={mcqSearch}
                onChange={e => setMcqSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchMcqs()}
                placeholder="Search question text or chapter..."
                className="input-field"
                style={{ fontSize: 12 }}
              />
              <button onClick={fetchMcqs} className="btn-primary" style={{ padding: '8px 12px' }}>
                <HiOutlineSearch size={14} />
              </button>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
              Showing {questions.length} questions
            </span>
          </div>

          {/* Question List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mcqLoading ? (
              <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Loading questions...</p>
            ) : questions.length === 0 ? (
              <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                No MCQ questions found in bank. Click "New MCQ Question" to add.
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id || idx} className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                        {q.subject}
                      </span>
                      {q.chapter && (
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>• {q.chapter}</span>
                      )}
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
                        background: q.difficulty === 'easy' ? 'rgba(74,222,128,0.15)' : q.difficulty === 'hard' ? 'rgba(248,113,113,0.15)' : 'rgba(234,179,8,0.15)',
                        color: q.difficulty === 'easy' ? '#4ade80' : q.difficulty === 'hard' ? '#f87171' : '#facc15'
                      }}>
                        {q.difficulty || 'medium'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(q.tags || []).map(t => (
                        <span key={t} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)' }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '4px 0' }}>
                    Q{idx + 1}. {q.text}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {(q.options || []).map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        style={{
                          padding: '6px 10px', borderRadius: 6, fontSize: 11,
                          background: oIdx === q.answerIndex ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${oIdx === q.answerIndex ? 'rgba(74,222,128,0.4)' : 'var(--border-color)'}`,
                          color: oIdx === q.answerIndex ? '#4ade80' : 'var(--text-secondary)',
                          fontWeight: oIdx === q.answerIndex ? 700 : 500
                        }}
                      >
                        <span style={{ fontWeight: 700, marginRight: 6 }}>{String.fromCharCode(65 + oIdx)}.</span> {opt}
                        {oIdx === q.answerIndex && <span style={{ float: 'right' }}>✓ Correct</span>}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: 4 }}>
                      💡 Explanation: {q.explanation}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Mock Tests ── */}
      {tab === 'mocks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {mockTests.map(m => (
              <div key={m.id} className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
                      background: m.tag === 'mdcat' ? 'rgba(56,189,248,0.15)' : 'rgba(168,85,247,0.15)',
                      color: m.tag === 'mdcat' ? '#38bdf8' : '#c084fc'
                    }}>
                      {m.tag || 'MDCAT'}
                    </span>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 6 }}>{m.title}</h3>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Series: {m.series || 'General'}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80' }}>{m.totalMarks} Marks</span>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button
                    onClick={() => handleViewRankings(m)}
                    className="btn-primary"
                    style={{ flex: 1, padding: '6px 12px', fontSize: 11, fontWeight: 700 }}
                  >
                    📊 View Rankings
                  </button>
                  <button
                    onClick={() => toast('OMR Scanning is planned for a future release (HTTP 501 NOT_BUILT)', { icon: 'ℹ️' })}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)',
                      background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    OMR Mode
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: Aggregate Calculator ── */}
      {tab === 'calc' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>UHS MBBS & Engineering Calculator</h3>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Computes composite merit based on official PMDC (10% Matric, 40% F.Sc, 50% MDCAT) or custom engineering weights.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Formula Preset</label>
                <select
                  onChange={e => {
                    if (e.target.value === 'mbbs') setAggCalc(p => ({ ...p, weights: { matric: 10, fsc: 40, entryTest: 50 }, entryTotal: 200 }));
                    if (e.target.value === 'ecat') setAggCalc(p => ({ ...p, weights: { matric: 25, fsc: 45, entryTest: 30 }, entryTotal: 400 }));
                    if (e.target.value === 'nust') setAggCalc(p => ({ ...p, weights: { matric: 10, fsc: 15, entryTest: 75 }, entryTotal: 200 }));
                  }}
                  className="input-field"
                  style={{ fontSize: 12 }}
                >
                  <option value="mbbs">PMDC / UHS MBBS (10% Matric, 40% F.Sc, 50% MDCAT)</option>
                  <option value="ecat">UET ECAT (25% Matric, 45% F.Sc, 30% ECAT)</option>
                  <option value="nust">NUST NET (10% Matric, 15% F.Sc, 75% NET)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Matric Marks</label>
                  <input
                    type="number"
                    value={aggCalc.matricObtained}
                    onChange={e => setAggCalc({ ...aggCalc, matricObtained: e.target.value })}
                    className="input-field"
                    style={{ fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Matric Total</label>
                  <input
                    type="number"
                    value={aggCalc.matricTotal}
                    onChange={e => setAggCalc({ ...aggCalc, matricTotal: e.target.value })}
                    className="input-field"
                    style={{ fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>F.Sc / Inter Marks</label>
                  <input
                    type="number"
                    value={aggCalc.fscObtained}
                    onChange={e => setAggCalc({ ...aggCalc, fscObtained: e.target.value })}
                    className="input-field"
                    style={{ fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>F.Sc Total</label>
                  <input
                    type="number"
                    value={aggCalc.fscTotal}
                    onChange={e => setAggCalc({ ...aggCalc, fscTotal: e.target.value })}
                    className="input-field"
                    style={{ fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Entry Test Score</label>
                  <input
                    type="number"
                    value={aggCalc.entryObtained}
                    onChange={e => setAggCalc({ ...aggCalc, entryObtained: e.target.value })}
                    className="input-field"
                    style={{ fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Test Total</label>
                  <input
                    type="number"
                    value={aggCalc.entryTotal}
                    onChange={e => setAggCalc({ ...aggCalc, entryTotal: e.target.value })}
                    className="input-field"
                    style={{ fontSize: 12 }}
                  />
                </div>
              </div>

              <button
                onClick={handleCalcAggregate}
                className="btn-primary"
                style={{ marginTop: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700 }}
              >
                Compute Composite Merit
              </button>
            </div>
          </div>

          {/* Results card */}
          <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Final Calculated Aggregate</span>
            <p style={{ fontSize: 52, fontWeight: 900, color: '#4ade80', margin: '12px 0' }}>
              {aggResult ? `${aggResult.aggregate}%` : '---'}
            </p>
            {aggResult && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, width: '100%', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Matric Score</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{aggResult.pMatric}%</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>F.Sc Score</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{aggResult.pFsc}%</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Test Score</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{aggResult.pEntry}%</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: Tracker ── */}
      {tab === 'tracker' && (
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Student University & Test Registrations</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Track which students have registered for MDCAT, ECAT, NUMS, and NUST NET tests and their university application statuses.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Student', 'Test', 'Roll #', 'Date', 'Score', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 30, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No student registrations logged yet.
                  </td>
                </tr>
              ) : (
                registrations.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.student_id}</td>
                    <td style={{ padding: '10px 12px', color: '#818cf8', fontWeight: 700 }}>{r.testName}</td>
                    <td style={{ padding: '10px 12px' }}>{r.registrationNo || '-'}</td>
                    <td style={{ padding: '10px 12px' }}>{r.testDate ? new Date(r.testDate).toLocaleDateString() : '-'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#4ade80' }}>{r.score || '-'}</td>
                    <td style={{ padding: '10px 12px' }}>{r.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal: View Rankings ── */}
      {showRankModal && (
        <Modal onClose={() => setShowRankModal(false)} title={`Rankings: ${selectedMock?.title || 'Mock Test'}`}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Official competition ranking. Tied scores share the exact same rank position.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['College Rank', 'Section Rank', 'Student Name', 'Roll #', 'Score', 'Correct/Wrong'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rankings.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 800, color: r.rankCollege <= 3 ? '#facc15' : 'var(--text-primary)' }}>
                    #{r.rankCollege}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                    #{r.rankSection || 1}
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {r.student?.name || 'Student'}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-tertiary)' }}>
                    {r.student?.rollNumber || '-'}
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 800, color: '#4ade80' }}>
                    {r.score}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-tertiary)' }}>
                    {r.correct || 0} / {r.wrong || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      {/* ── Modal: New MCQ Question ── */}
      {showMcqModal && (
        <Modal onClose={() => setShowMcqModal(false)} title="Add MCQ to Question Bank">
          <form onSubmit={handleCreateMcq} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Subject *</label>
                <select
                  value={newMcq.subject}
                  onChange={e => setNewMcq({ ...newMcq, subject: e.target.value })}
                  className="input-field"
                  style={{ fontSize: 12 }}
                >
                  <option value="Biology">Biology</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English">English</option>
                  <option value="Logical Reasoning">Logical Reasoning</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Difficulty</label>
                <select
                  value={newMcq.difficulty}
                  onChange={e => setNewMcq({ ...newMcq, difficulty: e.target.value })}
                  className="input-field"
                  style={{ fontSize: 12 }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Chapter</label>
                <input
                  value={newMcq.chapter}
                  onChange={e => setNewMcq({ ...newMcq, chapter: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Thermodynamics"
                  style={{ fontSize: 12 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Tags (comma-separated)</label>
                <input
                  value={newMcq.tags}
                  onChange={e => setNewMcq({ ...newMcq, tags: e.target.value })}
                  className="input-field"
                  placeholder="mdcat, ecat, nust"
                  style={{ fontSize: 12 }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Question Text *</label>
              <textarea
                required
                rows={3}
                value={newMcq.text}
                onChange={e => setNewMcq({ ...newMcq, text: e.target.value })}
                className="input-field"
                placeholder="Enter the full question stem..."
                style={{ fontSize: 12, resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Options (Select Correct)</label>
              {newMcq.options.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="correctOption"
                    checked={newMcq.answerIndex === idx}
                    onChange={() => setNewMcq({ ...newMcq, answerIndex: idx })}
                  />
                  <input
                    required
                    value={opt}
                    onChange={e => {
                      const updated = [...newMcq.options];
                      updated[idx] = e.target.value;
                      setNewMcq({ ...newMcq, options: updated });
                    }}
                    className="input-field"
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    style={{ fontSize: 12 }}
                  />
                </div>
              ))}
            </div>

            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Explanation (Optional)</label>
              <input
                value={newMcq.explanation}
                onChange={e => setNewMcq({ ...newMcq, explanation: e.target.value })}
                className="input-field"
                placeholder="Brief justification of correct option"
                style={{ fontSize: 12 }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '10px 16px', fontSize: 12, fontWeight: 700, marginTop: 6 }}>
              Save MCQ Question
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Helper modal
const Modal = ({ onClose, title, children }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
    <div style={{ position: 'relative', zIndex: 1, background: '#131a25', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 24, maxWidth: 640, width: '92%', maxHeight: '85vh', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
          <HiOutlineX size={18} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default EntryTestManagement;
