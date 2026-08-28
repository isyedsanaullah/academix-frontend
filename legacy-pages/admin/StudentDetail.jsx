import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineArrowLeft, HiOutlineAcademicCap, HiOutlineCurrencyDollar, HiOutlineClipboardCheck, HiOutlineChartBar, HiOutlinePrinter, HiOutlinePencil, HiOutlineTrash, HiOutlineCheck, HiOutlineX, HiOutlineSwitchHorizontal, HiOutlineClock, HiOutlinePlus } from 'react-icons/hi';

import FeeOverviewBanner from '@/components/fees/FeeOverviewBanner';
import FeeStructureModal from '@/components/fees/FeeStructureModal';
import RecordPaymentModal from '@/components/fees/RecordPaymentModal';
import PaymentHistoryModal from '@/components/fees/PaymentHistoryModal';
import FeeReceiptModal from '@/components/fees/FeeReceiptModal';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isReadOnly = user?.role === 'principal' || user?.role === 'teacher';
  const canManageFees = ['admin', 'principal', 'accountant'].includes(user?.role);

  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [structure, setStructure] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');

  // Modals state
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedFeeForHistory, setSelectedFeeForHistory] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);
  const [selectedFeeForReceipt, setSelectedFeeForReceipt] = useState(null);

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  const [sectionsList, setSectionsList] = useState([]);
  const [sectionMap, setSectionMap] = useState({});
  const [classesList, setClassesList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [shuffleClassId, setShuffleClassId] = useState('');
  const [shuffleGroupId, setShuffleGroupId] = useState('');
  const [shuffleSectionId, setShuffleSectionId] = useState('');

  useEffect(() => {
    fetchAll();
    fetchSections();
    fetchAcademicMetadata();
  }, [id]);

  const fetchAcademicMetadata = async () => {
    try {
      const [clsRes, grpRes] = await Promise.all([
        api.get('/classes'),
        api.get('/groups')
      ]);
      setClassesList(clsRes.data?.data || []);
      setGroupsList(grpRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch academic metadata:', err);
    }
  };

  const fetchSections = async () => {
    try {
      const { data } = await api.get('/sections');
      if (data.success && data.data) {
        const map = {};
        data.data.forEach(s => {
          const className = s.class_id?.name || '';
          if (s.code && className) {
            const compoundKey = `${className}_${s.code}`;
            map[compoundKey] = s.name || `Section ${s.code}`;
          }
        });
        setSectionMap(map);
        setSectionsList(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sections:', err);
    }
  };

  const fetchAll = async () => {
    try {
      const [stuRes, feeRes, structRes, attRes, resRes] = await Promise.all([
        api.get(`/students/${id}`),
        api.get('/fees', { params: { student_id: id, limit: 50 } }),
        api.get(`/fees/structure/${id}`),
        api.get('/attendance', { params: { student_id: id } }),
        api.get('/results', { params: { student_id: id } })
      ]);
      setStudent(stuRes.data.data);
      setFees(feeRes.data.data || []);
      setStructure(structRes.data.data || null);
      setAttendance(attRes.data.data || []);
      setResults(resRes.data.data || []);
    } catch { toast.error('Failed to load student details'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student removed successfully');
      navigate(`/${user?.role}/students`);
    } catch {
      toast.error('Failed to delete student');
    }
  };

  const handleStartInlineEdit = (key, val) => {
    setEditingField(key);
    if (key === 'dateOfBirth' || key === 'admissionDate') {
      if (val) {
        const d = new Date(val);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setEditValue(`${year}-${month}-${day}`);
      } else {
        setEditValue('');
      }
    } else if (key === 'academic_placement') {
      const currSec = sectionsList.find(s => s._id === student.section_id || s.id === student.section_id);
      if (currSec) {
        setShuffleClassId(currSec.class_id?._id || currSec.class_id?.id || '');
        setShuffleGroupId(currSec.group_id?._id || currSec.group_id?.id || '');
        setShuffleSectionId(currSec._id || currSec.id || '');
      } else {
        setShuffleClassId('');
        setShuffleGroupId('');
        setShuffleSectionId('');
      }
    } else {
      setEditValue(val || '');
    }
  };

  const handleCancelInlineEdit = () => {
    setEditingField(null);
    setEditValue('');
    setShuffleClassId('');
    setShuffleGroupId('');
    setShuffleSectionId('');
  };

  const handleSaveShuffle = async () => {
    if (!shuffleSectionId) {
      toast.error('Target section is required.');
      return;
    }
    try {
      const response = await api.put(`/students/${id}/shuffle`, { section_id: shuffleSectionId });
      toast.success(response.data?.message || 'Student shuffled successfully');
      setEditingField(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to shuffle student');
    }
  };

  const handleSaveInlineEdit = async (key) => {
    try {
      await api.put(`/students/${id}`, { [key]: editValue });
      toast.success('Updated successfully');
      setEditingField(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update field');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!student) return <div className="text-center py-20 text-surface-500">Student not found</div>;

  const totalFee = fees.reduce((s, f) => s + (f.totalAmount || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + (f.paidAmount || 0), 0);
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const totalDays = attendance.length;
  const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: HiOutlineAcademicCap },
    { id: 'fees', label: 'Fees', icon: HiOutlineCurrencyDollar },
    { id: 'attendance', label: 'Attendance', icon: HiOutlineClipboardCheck },
    { id: 'results', label: 'Results', icon: HiOutlineChartBar },
  ];

  const studentCompoundSecKey = `${student.class}_${student.section}`;
  const studentSecName = sectionMap[studentCompoundSecKey] || student.section;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors text-sm">
          <HiOutlineArrowLeft size={16} /> Back to Students
        </button>
        {!isReadOnly && (
          <div className="flex gap-2">
            <button onClick={handleDelete} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition border border-red-500/20">
              <HiOutlineTrash size={14} /> Delete Student
            </button>
          </div>
        )}
      </div>

      {/* Header Card */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {student.name?.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{student.name}</h1>
            <p className="text-surface-400 text-sm">s/o {student.fatherName}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="badge badge-primary">{student.rollNumber}</span>
              <span className="badge badge-info">{student.class} - {studentSecName} ({student.section})</span>
              <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{student.status}</span>
              <span className="badge badge-warning capitalize">{student.gender}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-surface-800/50">
              <p className="text-xl font-bold text-white">{attPct}%</p>
              <p className="text-xs text-surface-500">Attendance</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-800/50">
              <p className="text-xl font-bold text-emerald-400">Rs.{totalPaid.toLocaleString()}</p>
              <p className="text-xs text-surface-500">Paid</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-800/50">
              <p className="text-xl font-bold text-red-400">Rs.{(totalFee - totalPaid).toLocaleString()}</p>
              <p className="text-xs text-surface-500">Due</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-900/50 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-primary-600/20 text-primary-400' : 'text-surface-400 hover:text-surface-200'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Profile */}
      {tab === 'profile' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
              {[
                { key: 'name', label: 'Student Name', type: 'text', required: true },
                { key: 'rollNumber', label: 'Roll Number', type: 'text', required: true },
                { key: 'fatherName', label: 'Father Name', type: 'text', required: true },
                { key: 'cnic', label: 'CNIC / B-Form', type: 'text' },
                { key: 'phone', label: 'Phone', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
                { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female'] },
                { key: 'academic_placement', label: 'Class & Section (Academic)', type: 'academic_shuffle' },
                { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
                { key: 'admissionDate', label: 'Admission Date', type: 'date' },
                { key: 'address', label: 'Address', type: 'text' }
              ].map(field => {
                const isEditing = editingField === field.key;
                const rawValue = student[field.key];

                const getDisplayValue = (f, val) => {
                  if (f.key === 'academic_placement') {
                    return (
                      <div className="flex flex-col gap-1 mt-1 bg-surface-900/40 p-2.5 rounded-lg border border-white/5">
                        <span className="text-white font-semibold text-sm">
                          {student.class || 'No Class'} — <span className="text-indigo-400 font-bold">{student.group || 'No Group'}</span>
                        </span>
                        <span className="text-xs text-surface-400">
                          Section: <span className="text-emerald-400 font-bold">{student.section || 'N/A'}</span>{student.section_id && sectionMap[`${student.class}_${student.section}`] ? ` (${sectionMap[`${student.class}_${student.section}`]})` : ''}
                        </span>
                      </div>
                    );
                  }
                  if (val === undefined || val === null || val === '') return '-';
                  if (f.key === 'dateOfBirth' || f.key === 'admissionDate') {
                    return new Date(val).toLocaleDateString();
                  }
                  if (f.key === 'status') {
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${val === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${val === 'active' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-red-500 shadow-[0_0_6px_#ef4444]'}`} />
                        {val.charAt(0).toUpperCase() + val.slice(1)}
                      </span>
                    );
                  }
                  return String(val);
                };

                return (
                  <div key={field.key} className="group relative p-2.5 rounded-xl transition-all hover:bg-surface-800/20 border border-transparent hover:border-surface-800/30">
                    <p className="text-xs text-surface-500 uppercase tracking-wider flex items-center gap-1.5">
                      {field.label}
                      {!isReadOnly && !isEditing && field.type !== 'academic_shuffle' && (
                        <button
                          onClick={() => handleStartInlineEdit(field.key, rawValue)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 hover:text-indigo-300"
                          title={`Edit ${field.label}`}
                        >
                          <HiOutlinePencil size={11} className="inline-block" />
                        </button>
                      )}
                      {!isReadOnly && !isEditing && field.type === 'academic_shuffle' && (
                        <button
                          onClick={() => handleStartInlineEdit(field.key, rawValue)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 hover:text-emerald-300"
                          title="Shuffle Academic Placement"
                        >
                          <HiOutlineSwitchHorizontal size={14} className="inline-block" />
                        </button>
                      )}
                    </p>

                    {isEditing ? (
                      <div className="flex flex-col gap-1.5 mt-1 w-full">
                        {field.type === 'academic_shuffle' ? (
                          <div className="space-y-3 bg-surface-950/60 p-3.5 rounded-xl border border-white/5 shadow-inner">
                            <div>
                              <label className="block text-[10px] text-white/40 uppercase font-extrabold tracking-wider mb-1">Class / Academic Part</label>
                              <select
                                value={shuffleClassId}
                                onChange={e => {
                                  setShuffleClassId(e.target.value);
                                  setShuffleGroupId('');
                                  setShuffleSectionId('');
                                }}
                                className="w-full bg-surface-900 border border-surface-700 rounded-lg text-sm text-white px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                              >
                                <option value="">Select Class</option>
                                {classesList.map(c => (
                                  <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-white/40 uppercase font-extrabold tracking-wider mb-1">Academic Group / Stream</label>
                              <select
                                value={shuffleGroupId}
                                onChange={e => {
                                  setShuffleGroupId(e.target.value);
                                  setShuffleSectionId('');
                                }}
                                className="w-full bg-surface-900 border border-surface-700 rounded-lg text-sm text-white px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                                disabled={!shuffleClassId}
                              >
                                <option value="">Select Group</option>
                                {groupsList.filter(g => (g.class_id?._id || g.class_id) === shuffleClassId).map(g => (
                                  <option key={g._id || g.id} value={g._id || g.id}>{g.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-white/40 uppercase font-extrabold tracking-wider mb-1">Section Assignment</label>
                              <select
                                value={shuffleSectionId}
                                onChange={e => setShuffleSectionId(e.target.value)}
                                className="w-full bg-surface-900 border border-surface-700 rounded-lg text-sm text-white px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                                disabled={!shuffleGroupId}
                              >
                                <option value="">Select Section</option>
                                {sectionsList.filter(s => (s.group_id?._id || s.group_id) === shuffleGroupId).map(s => (
                                  <option key={s._id || s.id} value={s._id || s.id}>
                                    {s.code} {s.name ? `(${s.name})` : ''} — Limit: {s.capacity || 40} Students
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2 pt-2 border-t border-white/5">
                              <button
                                onClick={handleSaveShuffle}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition border border-indigo-500/20 shrink-0"
                                disabled={!shuffleSectionId}
                              >
                                <HiOutlineCheck size={13} />
                                <span>Confirm Shuffle</span>
                              </button>
                              <button
                                onClick={handleCancelInlineEdit}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition border border-red-500/20 shrink-0"
                              >
                                <HiOutlineX size={13} />
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>
                        ) : field.type === 'select' ? (
                          <select
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="w-full bg-surface-900 border border-surface-700 rounded-lg text-sm text-white px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                            autoFocus
                          >
                            {field.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type || 'text'}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="w-full bg-surface-900 border border-surface-700 rounded-lg text-sm text-white px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 animate-fade-in"
                            required={field.required}
                            autoFocus
                          />
                        )}
                        {field.type !== 'academic_shuffle' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveInlineEdit(field.key)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg transition border border-emerald-500/20 shrink-0"
                              title="Save"
                            >
                              <HiOutlineCheck size={13} />
                              <span className="hidden sm:inline">Save</span>
                            </button>
                            <button
                              onClick={handleCancelInlineEdit}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition border border-red-500/20 shrink-0"
                              title="Cancel"
                            >
                              <HiOutlineX size={13} />
                              <span className="hidden sm:inline">Cancel</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-surface-200 mt-0.5 font-medium">
                        {getDisplayValue(field, rawValue)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Guardian Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
              {[
                { key: 'guardianName', label: 'Guardian Name', type: 'text' },
                { key: 'guardianPhone', label: 'Guardian Phone', type: 'text' },
                { key: 'guardianRelation', label: 'Relation', type: 'text' }
              ].map(field => {
                const isEditing = editingField === field.key;
                const rawValue = student[field.key];

                return (
                  <div key={field.key} className="group relative p-2.5 rounded-xl transition-all hover:bg-surface-800/20 border border-transparent hover:border-surface-800/30">
                    <p className="text-xs text-surface-500 uppercase tracking-wider flex items-center gap-1.5">
                      {field.label}
                      {!isReadOnly && !isEditing && (
                        <button
                          onClick={() => handleStartInlineEdit(field.key, rawValue)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 hover:text-indigo-300"
                          title={`Edit ${field.label}`}
                        >
                          <HiOutlinePencil size={11} className="inline-block" />
                        </button>
                      )}
                    </p>

                    {isEditing ? (
                      <div className="flex flex-col gap-1.5 mt-1 w-full">
                        <input
                          type={field.type || 'text'}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-full bg-surface-900 border border-surface-700 rounded-lg text-sm text-white px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 animate-fade-in"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveInlineEdit(field.key)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg transition border border-emerald-500/20 shrink-0"
                            title="Save"
                          >
                            <HiOutlineCheck size={13} />
                            <span className="hidden sm:inline">Save</span>
                          </button>
                          <button
                            onClick={handleCancelInlineEdit}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition border border-red-500/20 shrink-0"
                            title="Cancel"
                          >
                            <HiOutlineX size={13} />
                            <span className="hidden sm:inline">Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-surface-200 mt-0.5 font-medium">
                        {rawValue || '-'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Fees */}
      {tab === 'fees' && (
        <div className="space-y-6">
          {/* Fee Overview KPI Banner */}
          <FeeOverviewBanner
            structure={structure}
            totalFee={totalFee}
            totalPaid={totalPaid}
            totalDue={Math.max(0, totalFee - totalPaid)}
            onConfigureClick={canManageFees ? () => setIsStructureModalOpen(true) : null}
          />

          {/* Obligations & Installments Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-surface-800 flex justify-between items-center">
              <h4 className="font-bold text-white text-sm">Fee Obligations & Installments Schedule</h4>
              {canManageFees && !structure && (
                <button
                  onClick={() => setIsStructureModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  <HiOutlinePlus size={14} /> Configure Structure
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Obligation Title / Period</th>
                    <th>Type</th>
                    <th>Due Date</th>
                    <th>Total Amount</th>
                    <th>Paid Amount</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-surface-500">
                        No fee obligations configured for this student yet. Click "Configure Fee Structure" to get started.
                      </td>
                    </tr>
                  ) : (
                    fees.map(f => {
                      const tot = Number(f.totalAmount) || 0;
                      const pd = Number(f.paidAmount) || 0;
                      const bal = Math.max(0, tot - pd);
                      const statusCls =
                        f.status === 'paid'
                          ? 'badge-success'
                          : f.status === 'partial'
                          ? 'badge-warning'
                          : f.status === 'overdue'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'badge-danger';

                      return (
                        <tr key={f._id || f.id}>
                          <td className="font-medium text-white">{f.title || f.month}</td>
                          <td className="capitalize text-xs text-surface-400">{f.type || 'monthly'}</td>
                          <td className="text-xs text-surface-400">
                            {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="font-semibold text-surface-200">Rs. {tot.toLocaleString()}</td>
                          <td className="text-emerald-400 font-semibold">Rs. {pd.toLocaleString()}</td>
                          <td className="text-rose-400 font-bold">Rs. {bal.toLocaleString()}</td>
                          <td>
                            <span className={`badge ${statusCls} capitalize`}>{f.status}</span>
                          </td>
                          <td className="text-right space-x-2">
                            {/* Record Payment Button */}
                            {canManageFees && f.status !== 'paid' && (
                              <button
                                onClick={() => {
                                  setSelectedFeeForPayment(f);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold rounded-lg transition border border-emerald-500/30"
                              >
                                Pay
                              </button>
                            )}

                            {/* Payment History Button */}
                            <button
                              onClick={() => {
                                setSelectedFeeForHistory(f);
                                setIsHistoryModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs font-semibold rounded-lg transition border border-surface-700"
                              title="View Payment History"
                            >
                              <HiOutlineClock size={14} /> History
                            </button>

                            {/* Print Receipt Button */}
                            {pd > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedFeeForReceipt(f);
                                  setSelectedPaymentForReceipt(f.payments?.[0] || { amount: pd, receiptNumber: f.receiptNumber || 'RCP', createdAt: f.paidDate });
                                  setIsReceiptModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-lg transition border border-indigo-500/30"
                                title="Print Receipt"
                              >
                                <HiOutlinePrinter size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Attendance */}
      {tab === 'attendance' && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-surface-800 flex items-center gap-4">
            <div className="flex gap-3">
              {[['Present', presentDays, 'badge-success'], ['Absent', attendance.filter(a=>a.status==='absent').length, 'badge-danger'], ['Late', attendance.filter(a=>a.status==='late').length, 'badge-warning']].map(([l, c, cls]) => (
                <span key={l} className={`badge ${cls}`}>{l}: {c}</span>
              ))}
            </div>
            <span className="text-sm text-surface-400 ml-auto">Total: {totalDays} days | {attPct}%</span>
          </div>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Status</th><th>Method</th><th>Entry</th><th>Exit</th></tr></thead>
            <tbody>
              {attendance.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-surface-500">No attendance records</td></tr> :
              attendance.slice(0, 30).map(a => (
                <tr key={a._id || a.id}>
                  <td>{new Date(a.date).toLocaleDateString()}</td>
                  <td><span className={`badge ${a.status==='present'?'badge-success':a.status==='absent'?'badge-danger':a.status==='late'?'badge-warning':'badge-info'}`}>{a.status}</span></td>
                  <td className="capitalize text-surface-400">{a.method}</td>
                  <td className="text-xs">{a.entryTime ? new Date(a.entryTime).toLocaleTimeString() : '-'}</td>
                  <td className="text-xs">{a.exitTime ? new Date(a.exitTime).toLocaleTimeString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content: Results */}
      {tab === 'results' && (
        <div className="space-y-4">
          {results.length === 0 ? <div className="glass-card p-8 text-center text-surface-500">No results available</div> :
          results.map(r => (
            <div key={r._id || r.id} className="glass-card p-5">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="font-semibold text-white">{r.exam_id?.name || 'Exam'}</h4>
                  <p className="text-xs text-surface-500">{r.exam_id?.class}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{r.percentage}%</p>
                  <span className={`badge ${r.grade==='F'?'badge-danger':r.percentage>=70?'badge-success':'badge-warning'}`}>{r.grade}</span>
                </div>
              </div>
              <div className="space-y-1">
                {r.marks?.map((m, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 rounded-lg bg-surface-800/40">
                    <span className="text-surface-300">{m.subject}</span>
                    <span className="text-surface-200 font-medium">{m.obtained}/{m.total}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t border-surface-800">
                <span className="text-sm font-medium text-surface-300">Total: {r.totalObtained}/{r.totalMarks}</span>
                <button onClick={() => navigate(`/admin/results/card/${r._id || r.id}`)} className="text-primary-400 hover:text-primary-300 text-xs flex items-center gap-1"><HiOutlinePrinter size={14} /> Result Card</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fee Modals */}
      <FeeStructureModal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        student={student}
        currentStructure={structure}
        onSuccess={fetchAll}
      />

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        fee={selectedFeeForPayment}
        student={student}
        onSuccess={(paymentObj) => {
          fetchAll();
          if (paymentObj) {
            setSelectedPaymentForReceipt(paymentObj);
            setSelectedFeeForReceipt(selectedFeeForPayment);
            setIsReceiptModalOpen(true);
          }
        }}
      />

      <PaymentHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        fee={selectedFeeForHistory}
        student={student}
        onPrintReceipt={(p) => {
          setSelectedPaymentForReceipt(p);
          setSelectedFeeForReceipt(selectedFeeForHistory);
          setIsReceiptModalOpen(true);
        }}
      />

      <FeeReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        payment={selectedPaymentForReceipt}
        fee={selectedFeeForReceipt}
        student={student}
      />
    </div>
  );
};

export default StudentDetail;

