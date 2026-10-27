import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineSwitchHorizontal,
  HiOutlineBookOpen,
  HiOutlineCheck,
  HiOutlineX
} from 'react-icons/hi';
import Pagination from '../../components/common/Pagination';

const Students = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isReadOnly = user?.role === 'principal' || user?.role === 'teacher';
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeSectionTab, setActiveSectionTab] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const limit = 15;
  
  // Dynamic lists from metadata
  const [classesList, setClassesList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);

  // Subject combinations in registration modal
  const [groupSubjects, setGroupSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loadingGroupSubjects, setLoadingGroupSubjects] = useState(false);

  // Move Group state & modal
  const [movingStudent, setMovingStudent] = useState(null);
  const [moveTargetGroupId, setMoveTargetGroupId] = useState('');
  const [moveTargetSectionId, setMoveTargetSectionId] = useState('');
  const [moveReason, setMoveReason] = useState('Academic Stream Transfer');
  const [moveGroupSubjects, setMoveGroupSubjects] = useState([]);
  const [moveSelectedSubjects, setMoveSelectedSubjects] = useState([]);
  const [moveLoading, setMoveLoading] = useState(false);
  
  const [form, setForm] = useState({
    name: '', rollNumber: '', fatherName: '', gender: 'male',
    class_id: '', group_id: '', section_id: '',
    phone: '', email: '', cnic: '', address: '',
    guardianName: '', guardianPhone: '', guardianRelation: '',
    createAccount: false, password: 'student123'
  });

  // Fetch metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [clsRes, grpRes, secRes] = await Promise.all([
          api.get('/classes'),
          api.get('/groups'),
          api.get('/sections')
        ]);
        setClassesList(clsRes.data.data || []);
        setGroupsList(grpRes.data.data || []);
        setSectionsList(secRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch academic metadata:', err);
        toast.error('Failed to load academic layout');
      }
    };
    fetchMetadata();
  }, []);

  const fetchStudents = async (targetPage = page, targetTab = activeSectionTab, targetSearch = search) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        limit: limit,
        search: targetSearch
      };
      if (targetTab !== 'ALL') {
        params.section_id = targetTab;
      }
      const { data } = await api.get('/students', { params });
      setStudents(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalStudents(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(page, activeSectionTab, search);
  }, [page, activeSectionTab]);

  // Handle search changes with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchStudents(1, activeSectionTab, search);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Fetch subjects configured for chosen group in register form
  const fetchGroupSubjectsForForm = async (groupId) => {
    if (!groupId) {
      setGroupSubjects([]);
      setSelectedSubjects([]);
      return;
    }
    setLoadingGroupSubjects(true);
    try {
      const res = await api.get(`/groups/${groupId}/subjects`);
      const subjects = res.data.data || [];
      setGroupSubjects(subjects);
      // Auto-select compulsory subjects
      const compulsoryIds = subjects.filter(s => s.kind === 'compulsory').map(s => s.subject_id);
      setSelectedSubjects(compulsoryIds);
    } catch {
      setGroupSubjects([]);
      setSelectedSubjects([]);
    } finally {
      setLoadingGroupSubjects(false);
    }
  };

  const handleToggleElective = (subjectId, electiveSet, maxChoices = 1) => {
    const isSelected = selectedSubjects.includes(subjectId);
    if (isSelected) {
      setSelectedSubjects(selectedSubjects.filter(id => id !== subjectId));
    } else {
      if (electiveSet) {
        const setSubjects = groupSubjects.filter(s => s.kind === 'elective' && s.electiveSet === electiveSet);
        const alreadyChosenInSet = selectedSubjects.filter(id => setSubjects.some(s => s.subject_id === id));
        if (alreadyChosenInSet.length >= maxChoices) {
          toast.error(`Maximum ${maxChoices} choice(s) allowed for "${electiveSet}"`);
          return;
        }
      }
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
  };

  // Move Group Handlers
  const openMoveModal = (student) => {
    setMovingStudent(student);
    const matchedClass = classesList.find(c => c.name === student.class);
    const classId = matchedClass?._id;
    const candidateGroups = groupsList.filter(g => 
      (!classId || g.class_id === classId) && g.name !== student.group
    );
    const initialTargetGroup = candidateGroups[0]?._id || (groupsList.find(g => g.name !== student.group)?._id || '');
    setMoveTargetGroupId(initialTargetGroup);
    setMoveTargetSectionId('');
    setMoveReason('Academic Stream Transfer');
    if (initialTargetGroup) {
      fetchMoveGroupSubjects(initialTargetGroup);
    } else {
      setMoveGroupSubjects([]);
      setMoveSelectedSubjects([]);
    }
  };

  const fetchMoveGroupSubjects = async (groupId) => {
    try {
      const res = await api.get(`/groups/${groupId}/subjects`);
      const subjects = res.data.data || [];
      setMoveGroupSubjects(subjects);
      const compulsoryIds = subjects.filter(s => s.kind === 'compulsory').map(s => s.subject_id);
      setMoveSelectedSubjects(compulsoryIds);
    } catch {
      setMoveGroupSubjects([]);
      setMoveSelectedSubjects([]);
    }
  };

  const handleMoveTargetGroupChange = (groupId) => {
    setMoveTargetGroupId(groupId);
    setMoveTargetSectionId('');
    if (groupId) {
      fetchMoveGroupSubjects(groupId);
    } else {
      setMoveGroupSubjects([]);
      setMoveSelectedSubjects([]);
    }
  };

  const handleToggleMoveElective = (subjectId, electiveSet, maxChoices = 1) => {
    const isSelected = moveSelectedSubjects.includes(subjectId);
    if (isSelected) {
      setMoveSelectedSubjects(moveSelectedSubjects.filter(id => id !== subjectId));
    } else {
      if (electiveSet) {
        const setSubjects = moveGroupSubjects.filter(s => s.kind === 'elective' && s.electiveSet === electiveSet);
        const alreadyChosenInSet = moveSelectedSubjects.filter(id => setSubjects.some(s => s.subject_id === id));
        if (alreadyChosenInSet.length >= maxChoices) {
          toast.error(`Maximum ${maxChoices} choice(s) allowed for "${electiveSet}"`);
          return;
        }
      }
      setMoveSelectedSubjects([...moveSelectedSubjects, subjectId]);
    }
  };

  const handleMoveSubmit = async (e) => {
    e.preventDefault();
    if (!movingStudent) return;
    if (!moveTargetGroupId) return toast.error('Please select a target group');

    setMoveLoading(true);
    try {
      await api.post(`/students/${movingStudent._id || movingStudent.id}/move-group`, {
        targetGroupId: moveTargetGroupId,
        section_id: moveTargetSectionId || undefined,
        reason: moveReason,
        subjectIds: moveSelectedSubjects
      });
      toast.success(`Student ${movingStudent.name} successfully transferred!`);
      setMovingStudent(null);
      fetchStudents(page, activeSectionTab, search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally {
      setMoveLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.class_id) return toast.error('Class selection is required');
    if (!form.group_id) return toast.error('Group selection is required');
    if (!form.section_id) return toast.error('Section selection is required');

    try {
      let studentId = editing;
      if (editing) {
        await api.put(`/students/${editing}`, form);
        toast.success('Student updated successfully');
      } else {
        const res = await api.post('/students', form);
        studentId = res.data.data?._id || res.data.data?.id;
        toast.success('Student registered successfully');
      }

      // Assign selected subjects if configured
      if (studentId && selectedSubjects.length > 0) {
        try {
          await api.post(`/students/${studentId}/subjects`, { subjectIds: selectedSubjects });
        } catch (subErr) {
          console.warn('Subject assignment warning:', subErr.response?.data?.message);
        }
      }

      setShowModal(false);
      setEditing(null);
      fetchStudents(page, activeSectionTab, search);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    }
  };

  const resetForm = () => {
    setForm({
      name: '', rollNumber: '', fatherName: '', gender: 'male',
      class_id: classesList[0]?._id || '',
      group_id: '',
      section_id: '',
      phone: '', email: '', cnic: '', address: '',
      guardianName: '', guardianPhone: '', guardianRelation: '',
      createAccount: false, password: 'student123'
    });
    setGroupSubjects([]);
    setSelectedSubjects([]);
  };

  const handleTabChange = (tabId) => {
    setActiveSectionTab(tabId);
    setPage(1);
  };

  const getActiveSectionDetails = () => {
    if (activeSectionTab === 'ALL') {
      return {
        name: 'All Sections',
        part: 'Full Session',
        code: 'ALL',
        groups: 'All Dynamic Streams',
        total: totalStudents,
        capacity: sectionsList.reduce((acc, curr) => acc + (curr.capacity || 40), 0)
      };
    }
    const sec = sectionsList.find(s => s._id === activeSectionTab);
    return {
      name: sec?.name || `Section ${sec?.code || ''}`,
      part: sec?.class_id?.name || 'N/A',
      code: sec?.code || 'N/A',
      groups: sec?.group_id?.name || 'N/A',
      total: totalStudents,
      capacity: sec?.capacity || 40
    };
  };

  const activeDetails = getActiveSectionDetails();

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-white/40 text-sm mt-1">{isReadOnly ? 'View dynamic roster logs' : 'Register and manage student rosters'}</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={() => { setEditing(null); resetForm(); setShowModal(true); }}
            className="btn-primary"
          >
            <HiOutlinePlus size={18} /> Add Student
          </button>
        )}
      </div>

      {/* Control bar: Search Input */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/60 border border-white/10 p-4 rounded-2xl shadow-md items-center">
        <div className="relative w-full max-w-md">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
            placeholder="Search students by name, roll number..."
          />
        </div>
      </div>

      {/* Section Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-1">
        <button
          onClick={() => handleTabChange('ALL')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border-t border-x ${
            activeSectionTab === 'ALL'
              ? 'bg-slate-950 text-indigo-400 border-white/10 font-black shadow-[0_-2px_10px_rgba(99,102,241,0.1)]'
              : 'bg-transparent text-slate-400 border-transparent hover:text-white'
          }`}
        >
          All Sections
        </button>
        {sectionsList.map(sec => (
          <button
            key={sec._id}
            onClick={() => handleTabChange(sec._id)}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border-t border-x ${
              activeSectionTab === sec._id
                ? 'bg-slate-950 text-indigo-400 border-white/10 font-black shadow-[0_-2px_10px_rgba(99,102,241,0.1)]'
                : 'bg-transparent text-slate-400 border-transparent hover:text-white'
            }`}
          >
            {sec.code} {sec.name ? `(${sec.name})` : ''} - {sec.class_id?.name || ''}
          </button>
        ))}
      </div>

      {/* Active Section Info Banner */}
      <div className="bg-gradient-to-r from-slate-950/80 to-slate-900/40 border border-white/5 border-l-4 border-l-indigo-500 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-md">
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block">Academic Group Context</span>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-white">{activeDetails.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/25 text-indigo-300">
              {activeDetails.part}
            </span>
            {activeDetails.code !== 'ALL' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                Code {activeDetails.code}
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-12 text-left border-t border-white/5 md:border-t-0 pt-4 md:pt-0">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Group Binding</span>
            <span className="text-xs font-semibold text-slate-200 mt-1 block">{activeDetails.groups}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Section Capacity</span>
            <span className="text-xs font-bold text-slate-200 mt-1 block font-mono">
              <span className="text-indigo-400 font-extrabold text-sm">{activeDetails.total}</span> / {activeDetails.capacity}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Dynamic Status</span>
            <span className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
              Synced
            </span>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="glass-card overflow-hidden shadow-2xl border border-white/5 rounded-2xl">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <p className="text-sm font-semibold">No students found under this selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="bg-slate-950/60 text-slate-300 border-b border-white/10 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 text-left">Student Details</th>
                  <th className="py-3 px-4 text-left">Roll Number</th>
                  <th className="py-3 px-4 text-left">Class & Dynamic Group</th>
                  <th className="py-3 px-4 text-left">Section</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map(s => {
                  return (
                    <tr
                      key={s._id}
                      className="cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => navigate(`/${user?.role}/students/${s._id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${s.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}
                            title={s.status === 'active' ? 'Active' : 'Inactive'}
                          />
                          <div>
                            <p className="font-semibold text-slate-100">{s.name}</p>
                            <p className="text-xs text-slate-400">s/o {s.fatherName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{s.rollNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {s.class} — <span className="text-indigo-400 text-xs font-semibold">{s.group}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-white/10">
                          {s.section}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        {!isReadOnly && (
                          <button
                            onClick={() => openMoveModal(s)}
                            disabled={s.status !== 'active'}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border inline-flex items-center gap-1.5 transition-colors ${
                              s.status === 'active'
                                ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/25'
                                : 'bg-white/5 text-white/30 border-white/5 cursor-not-allowed'
                            }`}
                            title={s.status === 'active' ? 'Transfer to another group' : 'Only active students can be moved'}
                          >
                            <HiOutlineSwitchHorizontal size={14} /> Move Group
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
      />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit' : 'Register New'} Student</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Student Name *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input-field" required placeholder="Full Name" />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Roll Number *</label>
                  <input value={form.rollNumber} onChange={e=>setForm({...form,rollNumber:e.target.value})} className="input-field" required placeholder="Academic Roll Number" />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Father Name *</label>
                  <input value={form.fatherName} onChange={e=>setForm({...form,fatherName:e.target.value})} className="input-field" required placeholder="Father Name" />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Gender</label>
                  <select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})} className="input-field">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                {/* Dynamic Academic Placements */}
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Class / Academic Part *</label>
                  <select
                    value={form.class_id}
                    onChange={e => setForm({ ...form, class_id: e.target.value, group_id: '', section_id: '' })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Class</option>
                    {classesList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Academic Group / Stream *</label>
                  <select
                    value={form.group_id}
                    onChange={e => {
                      const gid = e.target.value;
                      setForm({ ...form, group_id: gid, section_id: '' });
                      fetchGroupSubjectsForForm(gid);
                    }}
                    className="input-field"
                    required
                    disabled={!form.class_id}
                  >
                    <option value="">Select Group</option>
                    {groupsList.filter(g => g.class_id === form.class_id).map(g => (
                      <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Section Assignment *</label>
                  <select
                    value={form.section_id}
                    onChange={e => setForm({ ...form, section_id: e.target.value })}
                    className="input-field"
                    required
                    disabled={!form.group_id}
                  >
                    <option value="">Select Section</option>
                    {sectionsList.filter(s => s.group_id?._id === form.group_id || s.group_id === form.group_id).map(s => (
                      <option key={s._id} value={s._id}>
                        {s.code} {s.name ? `(${s.name})` : ''} — Limit: {s.capacity || 40} Students
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Combinations Configuration */}
                {form.group_id && (
                  <div className="md:col-span-2 border border-white/10 rounded-xl p-4 bg-slate-950/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HiOutlineBookOpen className="text-indigo-400" size={18} />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Subject Combination Rules</span>
                      </div>
                      <span className="text-[10px] text-white/40 font-mono">
                        {selectedSubjects.length} subjects chosen
                      </span>
                    </div>

                    {loadingGroupSubjects ? (
                      <div className="flex justify-center py-4">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : groupSubjects.length === 0 ? (
                      <p className="text-xs text-white/40 italic">
                        No custom subject rules configured for this group. Standard syllabus will be used.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {/* Compulsory subjects */}
                        {groupSubjects.filter(gs => gs.kind === 'compulsory').length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                              Compulsory Subjects (Automatic)
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {groupSubjects.filter(gs => gs.kind === 'compulsory').map(gs => (
                                <span
                                  key={gs._id}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center gap-1.5"
                                >
                                  <HiOutlineCheck size={14} className="text-emerald-400" />
                                  {gs.subject?.name || 'Subject'}
                                  {gs.subject?.code && <span className="text-[10px] text-emerald-400/60 font-mono">({gs.subject.code})</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Elective subjects grouped by electiveSet */}
                        {Object.entries(
                          groupSubjects.filter(gs => gs.kind === 'elective').reduce((acc, gs) => {
                            const setKey = gs.electiveSet || 'General Electives';
                            if (!acc[setKey]) acc[setKey] = [];
                            acc[setKey].push(gs);
                            return acc;
                          }, {})
                        ).map(([setName, items]) => {
                          const maxChoices = items[0]?.maxChoices || 1;
                          const chosenInSet = selectedSubjects.filter(id => items.some(gs => gs.subject_id === id)).length;
                          return (
                            <div key={setName} className="border-t border-white/5 pt-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                                  {setName} <span className="text-white/40 lowercase font-normal">(choose {maxChoices})</span>
                                </span>
                                <span className={`text-[10px] font-mono font-bold ${chosenInSet === maxChoices ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {chosenInSet} / {maxChoices} chosen
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {items.map(gs => {
                                  const isSelected = selectedSubjects.includes(gs.subject_id);
                                  return (
                                    <label
                                      key={gs._id}
                                      onClick={() => handleToggleElective(gs.subject_id, gs.electiveSet, maxChoices)}
                                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                        isSelected
                                          ? 'bg-indigo-500/15 border-indigo-500/40 text-white font-medium'
                                          : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="rounded bg-slate-800 border-white/20 text-indigo-600 focus:ring-0"
                                      />
                                      <span className="truncate">{gs.subject?.name || 'Subject'}</span>
                                      {gs.subject?.code && (
                                        <span className="text-[10px] text-white/30 ml-auto font-mono">{gs.subject.code}</span>
                                      )}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Phone Number</label>
                  <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="input-field" placeholder="Contact number" />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">CNIC / B-Form</label>
                  <input value={form.cnic} onChange={e=>setForm({...form,cnic:e.target.value})} className="input-field" placeholder="National Identifier" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Student Email Address</label>
                  <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input-field" type="email" placeholder="Unique email for registration" />
                </div>
              </div>

              {/* Guardian Info */}
              <div className="border-t border-white/5 pt-4 mt-2">
                <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Guardian Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase mb-1">Name</label>
                    <input value={form.guardianName} onChange={e=>setForm({...form,guardianName:e.target.value})} className="input-field" placeholder="Guardian Name" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase mb-1">Phone Number</label>
                    <input value={form.guardianPhone} onChange={e=>setForm({...form,guardianPhone:e.target.value})} className="input-field" placeholder="Contact Phone" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase mb-1">Relationship</label>
                    <input value={form.guardianRelation} onChange={e=>setForm({...form,guardianRelation:e.target.value})} className="input-field" placeholder="Father, Uncle, etc." />
                  </div>
                </div>
              </div>

              {!editing && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="createAcct"
                    checked={form.createAccount}
                    onChange={e => setForm({...form, createAccount: e.target.checked})}
                    className="rounded bg-[#1a2230] border-white/10 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="createAcct" className="text-xs text-white/60 cursor-pointer">Auto-create Student Portal Login account (Password: student123)</label>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button type="submit" className="btn-primary flex-1 justify-center py-2.5 font-bold shadow-lg">{editing ? 'Save Modifications' : 'Confirm Registration'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move Group Modal */}
      {movingStudent && (
        <div className="modal-overlay" onClick={() => !moveLoading && setMovingStudent(null)}>
          <div className="modal-content max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <HiOutlineSwitchHorizontal size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Transfer Student Group</h2>
                  <p className="text-xs text-white/40">Move student to another academic group and rewrite subject mappings</p>
                </div>
              </div>
              <button
                disabled={moveLoading}
                onClick={() => setMovingStudent(null)}
                className="text-white/40 hover:text-white"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            <form onSubmit={handleMoveSubmit} className="space-y-4">
              {/* Student Summary Banner */}
              <div className="bg-slate-950/60 border border-white/5 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">{movingStudent.name}</p>
                  <p className="text-xs text-white/50">Roll: <span className="text-indigo-400 font-mono font-semibold">{movingStudent.rollNumber}</span> • Class: {movingStudent.class}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Current Group</span>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block mt-0.5">
                    {movingStudent.group} ({movingStudent.section || 'No Sec'})
                  </span>
                </div>
              </div>

              {/* Target Group & Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Target Group *</label>
                  <select
                    value={moveTargetGroupId}
                    onChange={e => handleMoveTargetGroupChange(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Select Target Group</option>
                    {groupsList.filter(g => g.name !== movingStudent.group).map(g => (
                      <option key={g._id} value={g._id}>
                        {g.name} {g.seats ? `(Limit: ${g.seats})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Target Section (Optional)</label>
                  <select
                    value={moveTargetSectionId}
                    onChange={e => setMoveTargetSectionId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Auto-assign / Keep Section</option>
                    {sectionsList
                      .filter(s => !moveTargetGroupId || s.group_id?._id === moveTargetGroupId || s.group_id === moveTargetGroupId)
                      .map(s => (
                        <option key={s._id} value={s._id}>
                          {s.code} {s.name ? `(${s.name})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">Transfer Reason *</label>
                <select
                  value={moveReason}
                  onChange={e => setMoveReason(e.target.value)}
                  className="input-field"
                >
                  <option value="Academic Stream Transfer">Academic Stream Transfer (e.g. Pre-Med to ICS)</option>
                  <option value="Student Request">Student / Parent Formal Request</option>
                  <option value="Administrative Reassignment">Administrative Reassignment</option>
                  <option value="Seat Availability Adjustment">Seat Availability Adjustment</option>
                </select>
              </div>

              {/* Target Group Subject Combinations */}
              {moveTargetGroupId && (
                <div className="border border-white/10 rounded-xl p-3.5 bg-slate-950/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <HiOutlineBookOpen className="text-indigo-400" size={16} />
                      Target Group Subject Mapping
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {moveSelectedSubjects.length} subjects to be mapped
                    </span>
                  </div>

                  {moveGroupSubjects.length === 0 ? (
                    <p className="text-xs text-white/40 italic">
                      No custom rules for target group. Compulsory syllabus will be automatically associated.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Compulsory */}
                      {moveGroupSubjects.filter(gs => gs.kind === 'compulsory').length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                            Compulsory (Will be assigned)
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {moveGroupSubjects.filter(gs => gs.kind === 'compulsory').map(gs => (
                              <span
                                key={gs._id}
                                className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center gap-1"
                              >
                                <HiOutlineCheck size={12} className="text-emerald-400" />
                                {gs.subject?.name || 'Subject'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Electives */}
                      {Object.entries(
                        moveGroupSubjects.filter(gs => gs.kind === 'elective').reduce((acc, gs) => {
                          const setKey = gs.electiveSet || 'General Electives';
                          if (!acc[setKey]) acc[setKey] = [];
                          acc[setKey].push(gs);
                          return acc;
                        }, {})
                      ).map(([setName, items]) => {
                        const maxChoices = items[0]?.maxChoices || 1;
                        const chosenInSet = moveSelectedSubjects.filter(id => items.some(gs => gs.subject_id === id)).length;
                        return (
                          <div key={setName} className="border-t border-white/5 pt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                                {setName} (choose {maxChoices})
                              </span>
                              <span className={`text-[10px] font-mono font-bold ${chosenInSet === maxChoices ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {chosenInSet}/{maxChoices}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {items.map(gs => {
                                const isSelected = moveSelectedSubjects.includes(gs.subject_id);
                                return (
                                  <label
                                    key={gs._id}
                                    onClick={() => handleToggleMoveElective(gs.subject_id, gs.electiveSet, maxChoices)}
                                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-indigo-500/15 border-indigo-500/40 text-white font-medium'
                                        : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}}
                                      className="rounded bg-slate-800 border-white/20 text-indigo-600 focus:ring-0"
                                    />
                                    <span className="truncate">{gs.subject?.name || 'Subject'}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-white/5">
                <button
                  type="submit"
                  disabled={moveLoading}
                  className="btn-primary flex-1 justify-center py-2.5 font-bold shadow-lg"
                >
                  {moveLoading ? 'Transferring Student...' : 'Confirm Transfer'}
                </button>
                <button
                  type="button"
                  disabled={moveLoading}
                  onClick={() => setMovingStudent(null)}
                  className="btn-secondary flex-1 justify-center py-2.5"
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

export default Students;
