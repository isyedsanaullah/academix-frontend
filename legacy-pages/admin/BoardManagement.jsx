// legacy-pages/admin/BoardManagement.jsx
// Comprehensive Board Examination Portal:
// - Registration & Exam Admission Forms with Attendance Gating & Principal Override
// - External Candidate Registration (Private/Improvement)
// - Roll Number Slips & Datesheet Management
// - Gazette CSV Import & Unmatched Result Resolution
// - Institutional Performance Analytics & PDF Export
// - 7-Day Fee Reminder Dispatch

import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineAcademicCap,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineChartBar,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineUpload,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlinePrinter,
  HiOutlineUserAdd,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineX,
  HiOutlineLibrary
} from 'react-icons/hi';
import Pagination from '../../components/common/Pagination';

const BOARD_OPTIONS = [
  { key: 'FBISE Islamabad', name: 'Federal Board (FBISE Islamabad)' },
  { key: 'BISE Lahore', name: 'Lahore Board (BISE Lahore)' }
];

const BoardManagement = () => {
  const { user } = useAuth();
  const isSuperOrPrincipal = user?.role === 'admin' || user?.role === 'principal';

  const [activeTab, setActiveTab] = useState('forms'); // forms, slips, results, analytics
  const [selectedBoard, setSelectedBoard] = useState('FBISE Islamabad');
  const [sessionsList, setSessionsList] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [classesList, setClassesList] = useState([]);

  // Forms state
  const [forms, setForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [formSearch, setFormSearch] = useState('');
  const [formKindFilter, setFormKindFilter] = useState('ALL');
  const [formStatusFilter, setFormStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalForms, setTotalForms] = useState(0);

  // Modals state
  const [showBatchRegisterModal, setShowBatchRegisterModal] = useState(false);
  const [showExamAdmissionModal, setShowExamAdmissionModal] = useState(false);
  const [showExternalCandidateModal, setShowExternalCandidateModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideFormTarget, setOverrideFormTarget] = useState(null);
  const [overrideReason, setOverrideReason] = useState('Approved by Principal on institutional discretion');

  // Datesheet & Slips state
  const [datesheets, setDatesheets] = useState([]);
  const [loadingDatesheets, setLoadingDatesheets] = useState(false);
  const [showAddDatesheetModal, setShowAddDatesheetModal] = useState(false);
  const [datesheetForm, setDatesheetForm] = useState({
    examYear: new Date().getFullYear(),
    examType: 'annual',
    class: 'FSC Part 1',
    papers: [
      { subject: 'English', date: '2026-05-10', time: '09:00 AM - 12:00 PM' },
      { subject: 'Urdu', date: '2026-05-12', time: '09:00 AM - 12:00 PM' },
      { subject: 'Physics', date: '2026-05-15', time: '09:00 AM - 12:00 PM' }
    ]
  });

  // Results & Gazette state
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [unmatchedResults, setUnmatchedResults] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualResultModal, setShowManualResultModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fetch Metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [sessRes, clsRes] = await Promise.all([
          api.get('/sessions'),
          api.get('/classes')
        ]);
        const sessions = sessRes.data.data || [];
        setSessionsList(sessions);
        if (sessions.length > 0) setSelectedSession(sessions[0]._id);
        setClassesList(clsRes.data.data || []);
      } catch (err) {
        toast.error('Failed to load session/class metadata');
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Forms
  const fetchForms = async () => {
    if (!selectedSession) return;
    setLoadingForms(true);
    try {
      const params = {
        session_id: selectedSession,
        board: selectedBoard,
        search: formSearch,
        page,
        limit: 15
      };
      if (formKindFilter !== 'ALL') params.kind = formKindFilter;
      if (formStatusFilter !== 'ALL') params.status = formStatusFilter;

      const res = await api.get('/board/forms', { params });
      setForms(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotalForms(res.data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load board forms');
    } finally {
      setLoadingForms(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'forms') fetchForms();
  }, [activeTab, selectedSession, selectedBoard, formKindFilter, formStatusFilter, page]);

  // Fetch Datesheets
  const fetchDatesheets = async () => {
    if (!selectedSession) return;
    setLoadingDatesheets(true);
    try {
      const res = await api.get('/board/datesheets', {
        params: { session_id: selectedSession, board: selectedBoard }
      });
      setDatesheets(res.data.data || []);
    } catch {
      toast.error('Failed to load datesheets');
    } finally {
      setLoadingDatesheets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'slips') fetchDatesheets();
  }, [activeTab, selectedSession, selectedBoard]);

  // Fetch Results & Unmatched
  const fetchResults = async () => {
    if (!selectedSession) return;
    setLoadingResults(true);
    try {
      const [resRes, unRes] = await Promise.all([
        api.get('/board/results', { params: { session_id: selectedSession, board: selectedBoard } }),
        api.get('/board/results/unmatched', { params: { board: selectedBoard } })
      ]);
      setResults(resRes.data.data || []);
      setUnmatchedResults(unRes.data.data || []);
    } catch {
      toast.error('Failed to load board results');
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'results') fetchResults();
  }, [activeTab, selectedSession, selectedBoard]);

  // Fetch Analytics
  const fetchAnalytics = async () => {
    if (!selectedSession) return;
    setLoadingAnalytics(true);
    try {
      const res = await api.get('/board/results/analysis', {
        params: { session_id: selectedSession, board: selectedBoard }
      });
      setAnalytics(res.data.data || null);
    } catch {
      toast.error('Failed to load result analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab, selectedSession, selectedBoard]);

  // Status Advancement & Attendance Gating
  const handleAdvanceStatus = async (form, nextStatus, override = false) => {
    try {
      await api.patch(`/board/forms/${form._id || form.id}/status`, {
        status: nextStatus,
        overrideAttendance: override,
        remarks: override ? overrideReason : undefined
      });
      toast.success(`Form updated to "${nextStatus.toUpperCase()}"`);
      setShowOverrideModal(false);
      setOverrideFormTarget(null);
      fetchForms();
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.errorCode === 'ATTENDANCE_SHORTAGE') {
        setOverrideFormTarget(form);
        setShowOverrideModal(true);
      } else {
        toast.error(resData?.message || 'Failed to update form status');
      }
    }
  };

  // Dispatch Fee Reminders
  const handleDispatchFeeAlerts = async () => {
    try {
      const res = await api.post('/board/alerts/fee-deadline');
      toast.success(res.data.message || 'Fee reminders dispatched successfully');
    } catch {
      toast.error('Failed to dispatch fee alerts');
    }
  };

  // CSV Gazette Import
  const handleImportCsv = async (e) => {
    e.preventDefault();
    if (!csvText.trim()) return toast.error('Please paste or provide CSV content');
    setImporting(true);
    try {
      const res = await api.post('/board/results/import', {
        session_id: selectedSession,
        board: selectedBoard,
        examYear: new Date().getFullYear(),
        csvText
      });
      toast.success(res.data.message || 'Gazette imported successfully');
      setShowImportModal(false);
      setCsvText('');
      fetchResults();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <HiOutlineLibrary size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Board Examination Portal</h1>
              <p className="text-white/40 text-xs">Manage FBISE / BISE registrations, roll slips, attendance gating, and gazette analytics</p>
            </div>
          </div>
        </div>

        {/* Global Board & Session Pickers */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedBoard}
            onChange={e => setSelectedBoard(e.target.value)}
            className="input-field py-2 text-xs font-bold text-indigo-300 bg-slate-900 border-indigo-500/30"
          >
            {BOARD_OPTIONS.map(b => (
              <option key={b.key} value={b.key}>{b.name}</option>
            ))}
          </select>

          <select
            value={selectedSession}
            onChange={e => setSelectedSession(e.target.value)}
            className="input-field py-2 text-xs font-medium text-slate-300 bg-slate-900 border-white/10"
          >
            {sessionsList.map(s => (
              <option key={s._id} value={s._id}>{s.name} {s.isCurrent ? '(Current)' : ''}</option>
            ))}
          </select>

          {isSuperOrPrincipal && (
            <button
              onClick={handleDispatchFeeAlerts}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Notify parents of unpaid board fees due within 7 days"
            >
              <HiOutlineBell size={16} /> 7-Day Fee Alerts
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-1">
        {[
          { key: 'forms', label: 'Registration & Exam Forms', icon: HiOutlineDocumentText },
          { key: 'slips', label: 'Roll Number Slips & Datesheet', icon: HiOutlinePrinter },
          { key: 'results', label: 'Gazette & Result Entry', icon: HiOutlineClipboardCheck },
          { key: 'analytics', label: 'Board Performance Analytics', icon: HiOutlineChartBar }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-t border-x ${
                isActive
                  ? 'bg-slate-950 text-indigo-400 border-white/10 font-black shadow-[0_-2px_10px_rgba(99,102,241,0.1)]'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: REGISTRATION & EXAM ADMISSION FORMS */}
      {/* ===================================================================== */}
      {activeTab === 'forms' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-white/10 p-4 rounded-2xl shadow-md">
            <div className="relative flex-1 max-w-md">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                value={formSearch}
                onChange={e => setFormSearch(e.target.value)}
                placeholder="Search by student, roll number, or reg no..."
                className="input-field pl-10 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={formKindFilter}
                onChange={e => setFormKindFilter(e.target.value)}
                className="input-field py-1.5 text-xs w-auto bg-slate-900"
              >
                <option value="ALL">All Kinds</option>
                <option value="registration">Registration (1st Year)</option>
                <option value="exam_admission">Exam Admission (2nd Year)</option>
              </select>

              <select
                value={formStatusFilter}
                onChange={e => setFormStatusFilter(e.target.value)}
                className="input-field py-1.5 text-xs w-auto bg-slate-900"
              >
                <option value="ALL">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready (Attendance OK)</option>
                <option value="submitted">Submitted</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>

              {isSuperOrPrincipal && (
                <>
                  <button
                    onClick={() => setShowBatchRegisterModal(true)}
                    className="btn-primary py-2 text-xs font-bold"
                  >
                    <HiOutlinePlus size={16} /> Batch 1st-Year
                  </button>
                  <button
                    onClick={() => setShowExamAdmissionModal(true)}
                    className="btn-secondary py-2 text-xs font-bold"
                  >
                    <HiOutlinePlus size={16} /> Batch 2nd-Year
                  </button>
                  <button
                    onClick={() => setShowExternalCandidateModal(true)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
                  >
                    <HiOutlineUserAdd size={16} /> External Candidate
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Forms Table */}
          <div className="glass-card overflow-hidden shadow-2xl border border-white/5 rounded-2xl">
            {loadingForms ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : forms.length === 0 ? (
              <div className="text-center py-16 text-white/40 space-y-2">
                <p className="text-sm font-semibold">No board forms generated under this selection.</p>
                <p className="text-xs">Click "Batch 1st-Year" or "Batch 2nd-Year" above to generate registration dossiers.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr className="bg-slate-950/60 text-slate-300 border-b border-white/10 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 text-left">Candidate Info</th>
                      <th className="py-3 px-4 text-left">Kind & Type</th>
                      <th className="py-3 px-4 text-left">Board Roll & Reg No</th>
                      <th className="py-3 px-4 text-left">Board Fee</th>
                      <th className="py-3 px-4 text-left">Attendance</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {forms.map(form => {
                      const att = form.attendancePercent;
                      const isShort = att != null && att < 75;
                      return (
                        <tr key={form._id || form.id} className="hover:bg-white/5 transition-colors text-xs">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-bold text-white text-sm">{form.student?.name || 'External Candidate'}</p>
                              <p className="text-xs text-white/50">Roll: {form.student?.rollNumber || 'EXT'} • {form.group || 'General'}</p>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              form.kind === 'registration'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}>
                              {form.kind === 'registration' ? '1st-Yr Reg' : '2nd-Yr Exam'}
                            </span>
                            <span className="block text-[10px] text-white/40 mt-0.5 capitalize">
                              {form.candidateType || 'regular'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-mono font-bold text-indigo-300">{form.boardRollNumber || '—'}</p>
                            <p className="text-[10px] text-white/40 font-mono">{form.boardRegistrationNo || 'Awaiting Reg No'}</p>
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-semibold text-white">Rs. {form.feeAmount || 0}</p>
                            <span className={`text-[10px] font-bold uppercase ${form.fee?.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {form.fee?.status || 'unpaid'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {att != null ? (
                              <div>
                                <span className={`font-mono font-bold ${isShort ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {att.toFixed(1)}%
                                </span>
                                {isShort && (
                                  <span className="block text-[9px] text-red-400 font-semibold uppercase">
                                    {form.attendanceOverrideBy ? 'Overridden' : 'Shortage'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-white/30 text-[10px]">Unchecked</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              form.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                              form.status === 'submitted' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' :
                              form.status === 'accepted' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/25' :
                              form.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                              'bg-slate-800 text-slate-300 border border-white/10'
                            }`}>
                              {form.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {form.status === 'draft' && isSuperOrPrincipal && (
                                <button
                                  onClick={() => handleAdvanceStatus(form, 'ready')}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25"
                                  title="Verify attendance and mark ready"
                                >
                                  Mark Ready
                                </button>
                              )}

                              {form.status === 'ready' && isSuperOrPrincipal && (
                                <button
                                  onClick={() => handleAdvanceStatus(form, 'submitted')}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/25"
                                >
                                  Submit
                                </button>
                              )}

                              <button
                                onClick={() => window.open(`/api/board/forms/${form._id || form.id}/slip`, '_blank')}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                                title="Print Roll Number Slip"
                              >
                                <HiOutlinePrinter size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={p => setPage(p)} />
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: DATESHEETS & ROLL NUMBER SLIPS */}
      {/* ===================================================================== */}
      {activeTab === 'slips' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900/60 border border-white/10 p-4 rounded-2xl shadow-md">
            <div>
              <h2 className="text-base font-bold text-white">Board Examination Datesheets</h2>
              <p className="text-xs text-white/40">Official exam schedules configured for {selectedBoard}</p>
            </div>
            {isSuperOrPrincipal && (
              <button
                onClick={() => setShowAddDatesheetModal(true)}
                className="btn-primary py-2 text-xs font-bold"
              >
                <HiOutlinePlus size={16} /> Configure Datesheet
              </button>
            )}
          </div>

          {loadingDatesheets ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : datesheets.length === 0 ? (
            <div className="glass-card text-center py-12 text-white/40 rounded-2xl">
              <p className="text-sm font-semibold">No datesheets defined yet for {selectedBoard}.</p>
              <p className="text-xs mt-1">Configure datesheet papers so they appear automatically on generated roll number slips.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datesheets.map(ds => (
                <div key={ds._id} className="glass-card p-5 border border-white/10 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h3 className="font-bold text-white text-base">{ds.class} ({ds.examType})</h3>
                      <p className="text-xs text-indigo-400 font-mono">Exam Year: {ds.examYear} • {ds.board}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Paper Schedule</span>
                    <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                      {(ds.papers || []).map((p, idx) => (
                        <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">{p.subject}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{p.date} • {p.time || p.start}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: GAZETTE & RESULT ENTRY */}
      {/* ===================================================================== */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-white/10 p-4 rounded-2xl shadow-md">
            <div>
              <h2 className="text-base font-bold text-white">Board Results & Gazette Ledger</h2>
              <p className="text-xs text-white/40">Manual marks entry, automated CSV gazette import, and unmatched bindings</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="btn-primary py-2 text-xs font-bold flex items-center gap-1.5"
              >
                <HiOutlineUpload size={16} /> Import Gazette CSV
              </button>
              <button
                onClick={() => setShowManualResultModal(true)}
                className="btn-secondary py-2 text-xs font-bold flex items-center gap-1.5"
              >
                <HiOutlinePlus size={16} /> Manual Entry
              </button>
            </div>
          </div>

          {/* Unmatched Notice Banner */}
          {unmatchedResults.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HiOutlineExclamationCircle className="text-amber-400 shrink-0" size={24} />
                <div>
                  <h4 className="text-sm font-bold text-amber-300">{unmatchedResults.length} Unmatched Result Records</h4>
                  <p className="text-xs text-amber-300/70">Some imported roll numbers did not match registered students. Bind them manually below.</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Table */}
          <div className="glass-card overflow-hidden shadow-2xl border border-white/5 rounded-2xl">
            {loadingResults ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16 text-white/40 space-y-2">
                <p className="text-sm font-semibold">No board results recorded yet for {selectedBoard}.</p>
                <p className="text-xs">Import a gazette file or record student scores manually above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr className="bg-slate-950/60 text-slate-300 border-b border-white/10 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 text-left">Roll Number</th>
                      <th className="py-3 px-4 text-left">Matched Student</th>
                      <th className="py-3 px-4 text-left">Group</th>
                      <th className="py-3 px-4 text-left">Marks / Total</th>
                      <th className="py-3 px-4 text-left">Percentage</th>
                      <th className="py-3 px-4 text-left">Grade</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {results.map(r => (
                      <tr key={r._id} className="hover:bg-white/5 transition-colors text-xs">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-400">{r.boardRollNumber}</td>
                        <td className="py-3 px-4">
                          {r.student ? (
                            <div>
                              <p className="font-bold text-white">{r.student.name}</p>
                              <p className="text-[10px] text-white/40">Roll: {r.student.rollNumber}</p>
                            </div>
                          ) : (
                            <span className="text-amber-400 font-semibold text-[11px]">Unmatched Candidate</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{r.student?.group || 'General'}</td>
                        <td className="py-3 px-4 font-semibold text-white">{r.totalObtained || 0} / {r.totalMarks || 550}</td>
                        <td className="py-3 px-4 font-mono text-indigo-300 font-bold">{r.percentage?.toFixed(1)}%</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            r.grade === 'A+' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            r.grade === 'A' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' :
                            r.grade === 'F' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {r.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold uppercase ${r.status === 'pass' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 capitalize">{r.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: PERFORMANCE & INTELLIGENCE ANALYTICS */}
      {/* ===================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900/60 border border-white/10 p-4 rounded-2xl shadow-md">
            <div>
              <h2 className="text-base font-bold text-white">Institutional Board Performance</h2>
              <p className="text-xs text-white/40">Pass percentage, A+ counts, faculty efficacy, and group breakdown for {selectedBoard}</p>
            </div>
            <button
              onClick={() => window.open(`/api/board/results/analysis/pdf?session_id=${selectedSession}&board=${selectedBoard}`, '_blank')}
              className="btn-primary py-2 text-xs font-bold flex items-center gap-1.5"
            >
              <HiOutlineDownload size={16} /> Export Analysis PDF
            </button>
          </div>

          {loadingAnalytics ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !analytics ? (
            <div className="glass-card text-center py-16 text-white/40 rounded-2xl">
              <p className="text-sm font-semibold">No performance data available.</p>
              <p className="text-xs mt-1">Please import or record board results first.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-2xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Appeared</span>
                  <span className="text-2xl font-black text-indigo-400 mt-1 block">{analytics.overall.appeared}</span>
                </div>
                <div className="glass-card p-4 rounded-2xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Overall Pass Rate</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">{analytics.overall.passPercentage}%</span>
                </div>
                <div className="glass-card p-4 rounded-2xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">A+ Grades</span>
                  <span className="text-2xl font-black text-amber-400 mt-1 block">{analytics.overall.aPlusCount}</span>
                </div>
                <div className="glass-card p-4 rounded-2xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Failed / Compartment</span>
                  <span className="text-2xl font-black text-red-400 mt-1 block">{analytics.overall.failed + analytics.overall.compartment}</span>
                </div>
              </div>

              {/* Group Performance Comparison */}
              <div className="glass-card p-5 border border-white/10 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Academic Stream / Group Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr className="text-slate-300 border-b border-white/10 text-[10px] uppercase">
                        <th className="py-2.5 px-3 text-left">Academic Group</th>
                        <th className="py-2.5 px-3 text-left">Appeared</th>
                        <th className="py-2.5 px-3 text-left">Passed</th>
                        <th className="py-2.5 px-3 text-left">Pass Rate</th>
                        <th className="py-2.5 px-3 text-left">A+ Count</th>
                        <th className="py-2.5 px-3 text-left">Avg Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {(analytics.groupBreakdown || []).map(g => (
                        <tr key={g.group} className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-semibold text-white">{g.group}</td>
                          <td className="py-2.5 px-3">{g.appeared}</td>
                          <td className="py-2.5 px-3 text-emerald-400">{g.passed}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">{g.passPercentage}%</td>
                          <td className="py-2.5 px-3 font-bold text-amber-400">{g.aPlusCount}</td>
                          <td className="py-2.5 px-3 font-mono">{g.avgPercentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Teacher Performance */}
              <div className="glass-card p-5 border border-white/10 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Faculty & Subject Performance Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr className="text-slate-300 border-b border-white/10 text-[10px] uppercase">
                        <th className="py-2.5 px-3 text-left">Instructor</th>
                        <th className="py-2.5 px-3 text-left">Assigned Subject</th>
                        <th className="py-2.5 px-3 text-left">Students Appeared</th>
                        <th className="py-2.5 px-3 text-left">Passed</th>
                        <th className="py-2.5 px-3 text-left">Pass %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {(analytics.teacherBreakdown || []).map((t, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-white">{t.teacherName}</td>
                          <td className="py-2.5 px-3 text-indigo-300">{t.subject}</td>
                          <td className="py-2.5 px-3">{t.appeared}</td>
                          <td className="py-2.5 px-3 text-emerald-400">{t.passed}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">{t.passPercentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Merit Positions */}
              <div className="glass-card p-5 border border-white/10 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Board Merit Position Holders</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(analytics.positions || []).slice(0, 3).map((p, idx) => (
                    <div key={idx} className="bg-slate-900/60 p-4 rounded-xl border border-white/10 flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                        idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        idx === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30' :
                        'bg-amber-700/20 text-amber-500 border border-amber-700/30'
                      }`}>
                        #{p.position}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{p.studentName}</p>
                        <p className="text-xs text-indigo-400 font-mono">Roll: {p.boardRollNumber} • {p.percentage?.toFixed(1)}%</p>
                        <span className="text-[10px] text-white/40">{p.group}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODALS */}
      {/* ===================================================================== */}

      {/* 1. Batch 1st-Year Modal */}
      {showBatchRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowBatchRegisterModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-2">Batch 1st-Year Board Registration</h2>
            <p className="text-xs text-white/50 mb-4">Generates registration dossiers for all active 1st-year students and creates board fee vouchers.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await api.post('/board/forms/register-batch', {
                  session_id: selectedSession,
                  class: 'FSC Part 1',
                  board: selectedBoard,
                  feeAmount: 1500
                });
                toast.success(res.data.message || 'Batch registration completed');
                setShowBatchRegisterModal(false);
                fetchForms();
              } catch (err) {
                toast.error(err.response?.data?.message || 'Registration failed');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Target Board</label>
                <input value={selectedBoard} disabled className="input-field bg-slate-900/50 text-white/70" />
              </div>
              <div>
                <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Registration Fee (Rs.)</label>
                <input defaultValue={1500} type="number" className="input-field" required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center py-2 text-xs font-bold">Start Batch Generation</button>
                <button type="button" onClick={() => setShowBatchRegisterModal(false)} className="btn-secondary flex-1 justify-center py-2 text-xs">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Batch 2nd-Year Admission Modal */}
      {showExamAdmissionModal && (
        <div className="modal-overlay" onClick={() => setShowExamAdmissionModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-2">Batch 2nd-Year Exam Admission</h2>
            <p className="text-xs text-white/50 mb-4">Generates exam admission forms for all active 2nd-year candidates with their registered subjects.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await api.post('/board/forms/exam-admission-batch', {
                  session_id: selectedSession,
                  class: 'FSC Part 2',
                  board: selectedBoard,
                  feeAmount: 2500
                });
                toast.success(res.data.message || 'Exam admission forms generated');
                setShowExamAdmissionModal(false);
                fetchForms();
              } catch (err) {
                toast.error(err.response?.data?.message || 'Generation failed');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Target Board</label>
                <input value={selectedBoard} disabled className="input-field bg-slate-900/50 text-white/70" />
              </div>
              <div>
                <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Admission Fee (Rs.)</label>
                <input defaultValue={2500} type="number" className="input-field" required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center py-2 text-xs font-bold">Generate Admission Forms</button>
                <button type="button" onClick={() => setShowExamAdmissionModal(false)} className="btn-secondary flex-1 justify-center py-2 text-xs">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. External Candidate Modal */}
      {showExternalCandidateModal && (
        <div className="modal-overlay" onClick={() => setShowExternalCandidateModal(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-2">Register External Board Candidate</h2>
            <p className="text-xs text-white/50 mb-4">Direct board exam admission for Private, Improvement, or Compartment candidates.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              try {
                const res = await api.post('/board/forms/external-candidate', {
                  session_id: selectedSession,
                  board: selectedBoard,
                  name: fd.get('name'),
                  fatherName: fd.get('fatherName'),
                  cnic: fd.get('cnic'),
                  candidateType: fd.get('candidateType'),
                  group: fd.get('group'),
                  previousBoardRollNo: fd.get('prevRoll'),
                  previousRegistrationNo: fd.get('prevReg'),
                  feeAmount: fd.get('feeAmount')
                });
                toast.success(res.data.message || 'External candidate registered');
                setShowExternalCandidateModal(false);
                fetchForms();
              } catch (err) {
                toast.error(err.response?.data?.message || 'Registration failed');
              }
            }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Candidate Name *</label>
                  <input name="name" required className="input-field text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Father Name *</label>
                  <input name="fatherName" required className="input-field text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Candidate Type *</label>
                  <select name="candidateType" className="input-field text-xs">
                    <option value="private">Private</option>
                    <option value="improvement">Improvement</option>
                    <option value="compartment">Compartment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Academic Group</label>
                  <select name="group" className="input-field text-xs">
                    <option value="Pre-Medical">Pre-Medical</option>
                    <option value="Pre-Engineering">Pre-Engineering</option>
                    <option value="Computer Science">Computer Science (ICS)</option>
                    <option value="Commerce">Commerce (I.Com)</option>
                    <option value="Humanities">Humanities</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Previous Roll No</label>
                  <input name="prevRoll" className="input-field text-xs font-mono" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Previous Reg No</label>
                  <input name="prevReg" className="input-field text-xs font-mono" placeholder="Optional" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Exam Fee (Rs.)</label>
                  <input name="feeAmount" defaultValue={2500} type="number" className="input-field text-xs" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center py-2 text-xs font-bold">Register Candidate</button>
                <button type="button" onClick={() => setShowExternalCandidateModal(false)} className="btn-secondary flex-1 justify-center py-2 text-xs">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Principal Attendance Override Modal */}
      {showOverrideModal && overrideFormTarget && (
        <div className="modal-overlay" onClick={() => setShowOverrideModal(false)}>
          <div className="modal-content max-w-md border-amber-500/30" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 text-amber-400 mb-2">
              <HiOutlineExclamationCircle size={24} />
              <h2 className="text-base font-bold text-white">Attendance Shortage Detected</h2>
            </div>
            <p className="text-xs text-white/60 mb-3">
              Candidate <span className="text-white font-semibold">{overrideFormTarget.student?.name}</span> has an attendance of{' '}
              <span className="text-red-400 font-bold font-mono">{overrideFormTarget.attendancePercent?.toFixed(1)}%</span> (minimum required: 75%).
            </p>
            <p className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 mb-4">
              As Principal / Administrator, you can provide an executive waiver with institutional remarks to advance the form to "READY".
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Waiver Reason / Remarks *</label>
                <textarea
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  className="input-field text-xs h-20"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAdvanceStatus(overrideFormTarget, 'ready', true)}
                  className="btn-primary flex-1 justify-center py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500"
                >
                  Confirm Executive Waiver
                </button>
                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="btn-secondary flex-1 justify-center py-2 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Gazette CSV Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => !importing && setShowImportModal(false)}>
          <div className="modal-content max-w-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-1">Import Board Gazette CSV</h2>
            <p className="text-xs text-white/50 mb-4">Paste comma or tab-delimited result records from {selectedBoard}. Roll numbers are matched automatically.</p>
            <form onSubmit={handleImportCsv} className="space-y-4">
              <div>
                <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">
                  CSV / Gazette Text Content
                </label>
                <textarea
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  placeholder="roll_no,candidate_name,father_name,total_marks,obtained_marks,grade,status&#10;100201,Ahmed Ali,Tariq Ali,550,472,A+,pass"
                  className="input-field text-xs font-mono h-48"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={importing}
                  className="btn-primary flex-1 justify-center py-2 text-xs font-bold"
                >
                  {importing ? 'Processing & Matching...' : 'Start Gazette Import'}
                </button>
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => setShowImportModal(false)}
                  className="btn-secondary flex-1 justify-center py-2 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardManagement;
