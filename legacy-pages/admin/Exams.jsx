import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineDocumentText, 
  HiOutlineCalendar, 
  HiOutlineClock, 
  HiOutlineClipboardList,
  HiOutlineBookmark,
  HiOutlineCheck,
  HiOutlineUserGroup
} from 'react-icons/hi';

const addDaysSkippingSundays = (startDateStr, daysToAdd) => {
  if (!startDateStr) return '';
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) return '';
  
  let added = 0;
  while (added < daysToAdd) {
    date.setDate(date.getDate() + 1);
    // 0 represents Sunday
    if (date.getDay() !== 0) {
      added++;
    }
  }
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const Exams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allSections, setAllSections] = useState([]);

  // Holds actual selection
  const [selectedSections, setSelectedSections] = useState(['all']);
  const [samePattern, setSamePattern] = useState(false);

  const [form, setForm] = useState({
    name: '',
    class: 'FSC Part 1',
    group: 'all',
    section: 'all',
    type: 'mid',
    subjects: [{ subject_id: '', name: '', totalMarks: 100, passingMarks: 33, date: '', startTime: '', endTime: '' }]
  });

  const fetchExams = async () => {
    try {
      const { data } = await api.get('/exams');
      setExams(data.data || []);
    } catch {
      toast.error('Failed to load examinations list');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setAllSubjects(data.data || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const fetchSections = async () => {
    try {
      const { data } = await api.get('/sections');
      setAllSections(data.data || []);
    } catch (err) {
      console.error('Failed to fetch sections:', err);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchSubjects();
    fetchSections();
  }, []);

  const resetForm = () => {
    setSelectedSections(['all']);
    setSamePattern(false);
    setForm({
      name: '',
      class: 'FSC Part 1',
      group: 'all',
      section: 'all',
      type: 'mid',
      subjects: [{ subject_id: '', name: '', totalMarks: 100, passingMarks: 33, date: '', startTime: '', endTime: '' }]
    });
  };

  const handleClassChange = (newCls) => {
    setSelectedSections(['all']);
    setSamePattern(false);
    setForm({
      ...form,
      class: newCls,
      section: 'all',
      subjects: [{ subject_id: '', name: '', totalMarks: 100, passingMarks: 33, date: '', startTime: '', endTime: '' }]
    });
  };

  const handleSectionToggle = (secName) => {
    if (secName === 'all') {
      setSelectedSections(['all']);
      setForm(prev => ({ ...prev, section: 'all' }));
    } else {
      setSelectedSections(prev => {
        let next = prev.filter(x => x !== 'all');
        if (next.includes(secName)) {
          next = next.filter(x => x !== secName);
        } else {
          next = [...next, secName];
        }
        
        if (next.length === 0) {
          next = ['all'];
        }
        
        const sectionValue = next.includes('all') ? 'all' : next.join(', ');
        setForm(f => ({ ...f, section: sectionValue }));
        return next;
      });
    }
  };

  const handleSamePatternToggle = (checked) => {
    setSamePattern(checked);
    if (checked) {
      // Calculate subjects selectable for this class
      const currentSelectable = allSubjects.filter(sub => 
        form.class === 'Both' ? true : (sub.class === 'Both' || sub.class === form.class)
      );

      // Get the existing values from the first row if available, otherwise use defaults
      const firstRow = form.subjects[0] || { 
        totalMarks: 100, 
        passingMarks: 33, 
        date: '', 
        startTime: '', 
        endTime: '' 
      };
      
      // Map all currentSelectable to form.subjects with smart date increment
      const populatedSubjects = currentSelectable.map((sub, idx) => ({
        subject_id: sub._id,
        name: sub.name,
        totalMarks: firstRow.totalMarks || sub.totalMarks || 100,
        passingMarks: firstRow.passingMarks || sub.passingMarks || 33,
        date: firstRow.date ? addDaysSkippingSundays(firstRow.date, idx) : '',
        startTime: firstRow.startTime || '',
        endTime: firstRow.endTime || ''
      }));

      setForm(prev => ({ 
        ...prev, 
        subjects: populatedSubjects.length > 0 ? populatedSubjects : [{ 
          subject_id: '', 
          name: '', 
          totalMarks: 100, 
          passingMarks: 33, 
          date: '', 
          startTime: '', 
          endTime: '' 
        }]
      }));
    }
  };

  const addSubject = () => {
    const firstRow = form.subjects[0] || { totalMarks: 100, passingMarks: 33, date: '', startTime: '', endTime: '' };
    const newSubject = samePattern 
      ? { 
          subject_id: '', 
          name: '', 
          totalMarks: firstRow.totalMarks, 
          passingMarks: firstRow.passingMarks, 
          date: firstRow.date, 
          startTime: firstRow.startTime, 
          endTime: firstRow.endTime 
        }
      : { 
          subject_id: '', 
          name: '', 
          totalMarks: 100, 
          passingMarks: 33, 
          date: '', 
          startTime: '', 
          endTime: '' 
        };

    setForm(prev => ({
      ...prev,
      subjects: [...prev.subjects, newSubject]
    }));
  };

  const removeSubject = (i) => {
    setForm({
      ...form,
      subjects: form.subjects.filter((_, idx) => idx !== i)
    });
  };

  const updateSubject = (i, field, val) => {
    let nextSubjects = [...form.subjects];

    if (field === 'subject_id') {
      const selectedSub = allSubjects.find(sub => sub._id === val);
      if (selectedSub) {
        nextSubjects[i] = {
          ...nextSubjects[i],
          subject_id: val,
          name: selectedSub.name,
          totalMarks: selectedSub.totalMarks || 100,
          passingMarks: selectedSub.passingMarks || 33
        };
      } else {
        nextSubjects[i] = {
          ...nextSubjects[i],
          subject_id: '',
          name: '',
          totalMarks: 100,
          passingMarks: 33
        };
      }
    } else {
      nextSubjects[i] = { ...nextSubjects[i], [field]: val };
    }

    // Apply pattern replication if samePattern is true
    if (samePattern) {
      if (i === 0) {
        const firstRow = nextSubjects[0];
        nextSubjects = nextSubjects.map((sub, idx) => {
          if (idx === 0) return sub;
          return {
            ...sub,
            date: field === 'date' ? addDaysSkippingSundays(val, idx) : addDaysSkippingSundays(firstRow.date, idx),
            startTime: field === 'startTime' ? val : firstRow.startTime,
            endTime: field === 'endTime' ? val : firstRow.endTime,
            totalMarks: field === 'totalMarks' ? val : firstRow.totalMarks,
            passingMarks: field === 'passingMarks' ? val : firstRow.passingMarks
          };
        });
      } else if (['date', 'startTime', 'endTime', 'totalMarks', 'passingMarks'].includes(field)) {
        // Devised custom changes on another row, disable synchronization
        setSamePattern(false);
      }
    }

    setForm({ ...form, subjects: nextSubjects });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.subjects.some(s => !s.subject_id)) {
      return toast.error('Please select a subject for all rows');
    }

    try {
      await api.post('/exams', form);
      toast.success('Exam created & announcement posted');
      setShowModal(false);
      fetchExams();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create exam');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      toast.success('Exam deleted');
      fetchExams();
    } catch {
      toast.error('Failed to delete exam');
    }
  };

  // Filter sections by selected class
  const availableSections = allSections.filter(sec => 
    form.class === 'Both' 
      ? (sec.class_id?.name === 'FSC Part 1' || sec.class_id?.name === 'FSC Part 2')
      : sec.class_id?.name === form.class
  );

  // Filter subjects strictly by class only
  const selectableSubjects = allSubjects.filter(sub => {
    return form.class === 'Both' ? true : (sub.class === 'Both' || sub.class === form.class);
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Examinations</h1>
          <p className="text-white/40 text-sm mt-1">Schedule exams, configure target groups, and generate schedules</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={() => { resetForm(); setShowModal(true); }} 
            className="btn-primary inline-flex items-center gap-1.5"
          >
            <HiOutlinePlus size={18} /> Create Exam
          </button>
          <button 
            onClick={() => navigate('/admin/exams/roll-slips')} 
            className="btn-secondary inline-flex items-center gap-1.5"
          >
            <HiOutlineDocumentText size={18} /> Roll Slips
          </button>
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex justify-center py-20">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <div className="col-span-2 glass-card text-center py-20 text-white/30 border border-white/5 rounded-2xl shadow-lg">
            <HiOutlineClipboardList className="mx-auto mb-4 text-white/10" size={48} />
            <p className="text-base font-semibold">No examinations scheduled yet</p>
            <p className="text-xs text-white/20 mt-1">Click 'Create Exam' to schedule your first test or midterm.</p>
          </div>
        ) : (
          exams.map(exam => {
            const sectionStr = exam.section === 'all' ? 'All Sections' : `Sections: ${exam.section}`;
            return (
              <div key={exam._id} className="glass-card p-6 rounded-2xl border border-white/5 shadow-xl hover:border-white/10 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-wide">{exam.name}</h3>
                      <div className="flex flex-wrap gap-2 items-center mt-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {exam.class}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-slate-800 text-slate-300 border border-white/5">
                          {sectionStr}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border shadow-sm ${
                        exam.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : exam.status === 'ongoing' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : exam.status === 'cancelled'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {exam.status}
                      </span>
                      <button 
                        onClick={() => handleDelete(exam._id)} 
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/25 text-white/40 hover:text-red-400 transition-all shadow-sm"
                        title="Delete Exam"
                      >
                        <HiOutlineTrash size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 mt-4">
                    <p className="text-[10px] font-extrabold text-white/30 uppercase tracking-widest pl-1 mb-1">Exam Papers Schedule</p>
                    {exam.subjects?.map((s, i) => {
                      const dateStr = s.date ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';
                      const timeStr = (s.startTime && s.endTime) ? `${s.startTime} - ${s.endTime}` : 'TBD';
                      return (
                        <div key={i} className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-950/40 border border-white/[0.03] hover:border-white/5 transition-all">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-200 block">{s.name}</span>
                            <span className="text-[10px] text-white/40 flex items-center gap-1.5">
                              <HiOutlineCalendar size={12} className="text-indigo-400" /> {dateStr}
                              <span className="text-white/20">•</span>
                              <HiOutlineClock size={12} className="text-indigo-400" /> {timeStr}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-indigo-300 font-bold block">{s.totalMarks} M</span>
                            <span className="text-[9px] text-white/30 block">Pass: {s.passingMarks || 33}</span>
                          </div>
                        </div>
                      );
                    })}
                    {(!exam.subjects || exam.subjects.length === 0) && (
                      <p className="text-xs text-white/30 italic pl-1">No subjects scheduled for this exam.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Creation Modal - Large Spacious Width */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div 
            className="modal-content !max-w-6xl w-[95%] md:w-[90%] p-6 md:p-8" 
            style={{ maxWidth: '1200px' }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-white tracking-wide">Schedule Examination</h2>
                <p className="text-xs text-white/40 mt-1">Configure parameters, select sections, and schedule subject timings</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/35 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              {/* Top basic parameters grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-950/30 p-5 rounded-2xl border border-white/[0.04]">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HiOutlineBookmark className="text-indigo-400" size={14} /> Exam Name *
                  </label>
                  <input 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    className="input-field py-2.5 text-xs font-semibold" 
                    placeholder="E.g., Midterm Examination 2026"
                    required 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HiOutlineClipboardList className="text-indigo-400" size={14} /> Assessment Type
                  </label>
                  <select 
                    value={form.type} 
                    onChange={e => setForm({ ...form, type: e.target.value })} 
                    className="input-field py-2.5 text-xs font-semibold"
                  >
                    <option value="mid">Midterm</option>
                    <option value="final">Final Exam</option>
                    <option value="test">Monthly Test</option>
                    <option value="practical">Practical Exam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HiOutlineUserGroup className="text-indigo-400" size={14} /> Target Class
                  </label>
                  <select 
                    value={form.class} 
                    onChange={e => handleClassChange(e.target.value)} 
                    className="input-field py-2.5 text-xs font-semibold"
                  >
                    <option value="FSC Part 1">FSC Part 1</option>
                    <option value="FSC Part 2">FSC Part 2</option>
                    <option value="Both">Both Parts</option>
                  </select>
                </div>
              </div>

              {/* Target Sections Grid Toggles */}
              <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Target Sections *</h4>
                  <p className="text-[11px] text-white/40 mt-0.5">Toggle one or multiple sections to target, or select All Sections</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSectionToggle('all')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                      selectedSections.includes('all')
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-md shadow-indigo-500/5'
                        : 'bg-[#161b22]/40 text-white/50 border-white/5 hover:border-white/10 hover:text-white/70'
                    }`}
                  >
                    All Sections
                  </button>
                  {availableSections.map(sec => {
                    const secName = sec.name || `Section ${sec.code}`;
                    const isSelected = selectedSections.includes(secName);
                    return (
                      <button
                        key={sec._id}
                        type="button"
                        onClick={() => handleSectionToggle(secName)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-md shadow-indigo-500/5 scale-[1.02]'
                            : 'bg-[#161b22]/40 text-white/50 border-white/5 hover:border-white/10 hover:text-white/70'
                        }`}
                      >
                        {secName} ({sec.code}){form.class === 'Both' ? ` - ${sec.class_id?.name}` : ''}
                      </button>
                    );
                  })}
                  {availableSections.length === 0 && (
                    <p className="text-xs text-white/30 italic pl-1">No active sections configured for {form.class}.</p>
                  )}
                </div>
              </div>

              {/* Subjects Papers Management Block */}
              <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/5 pb-3">
                  <div>
                    <p className="text-sm font-extrabold text-white tracking-wide">Exam Schedule & Subjects</p>
                    <p className="text-[11px] text-white/40 mt-0.5">Select subjects and define individual timings</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-indigo-300 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={samePattern} 
                        onChange={e => handleSamePatternToggle(e.target.checked)} 
                        className="w-4 h-4 rounded accent-indigo-500 bg-[#161b22] border-white/10" 
                      />
                      Same schedule & marks for all
                    </label>

                    <button 
                      type="button" 
                      onClick={addSubject} 
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition border border-indigo-500/20 shadow-sm cursor-pointer"
                    >
                      + Add Subject Row
                    </button>
                  </div>
                </div>

                {/* Grid of inputs with integer slots */}
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {form.subjects.map((s, i) => (
                    <div 
                      key={i} 
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 bg-slate-950/40 rounded-2xl border border-white/[0.03] hover:border-white/5 transition-all items-end"
                    >
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Select Subject *</label>
                        <select
                          value={s.subject_id}
                          onChange={e => updateSubject(i, 'subject_id', e.target.value)}
                          className="input-field py-2 text-xs font-semibold"
                          required
                        >
                          <option value="">-- Choose Subject --</option>
                          {selectableSubjects.map(sub => (
                            <option key={sub._id} value={sub._id}>
                              {sub.name} ({sub.code || sub.group})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Exam Date *</label>
                        <input 
                          type="date" 
                          value={s.date} 
                          onChange={e => updateSubject(i, 'date', e.target.value)} 
                          className="input-field py-2 text-xs font-semibold"
                          required 
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Start Time *</label>
                        <input 
                          type="time" 
                          value={s.startTime} 
                          onChange={e => updateSubject(i, 'startTime', e.target.value)} 
                          className="input-field py-2 text-xs font-semibold"
                          required 
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">End Time *</label>
                        <input 
                          type="time" 
                          value={s.endTime} 
                          onChange={e => updateSubject(i, 'endTime', e.target.value)} 
                          className="input-field py-2 text-xs font-semibold"
                          required 
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5 text-center">Marks</label>
                        <input 
                          type="number" 
                          value={s.totalMarks} 
                          onChange={e => updateSubject(i, 'totalMarks', Number(e.target.value))} 
                          className="input-field py-2 text-xs font-bold text-center"
                          title="Total Marks"
                          required 
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5 text-center">Pass</label>
                        <input 
                          type="number" 
                          value={s.passingMarks} 
                          onChange={e => updateSubject(i, 'passingMarks', Number(e.target.value))} 
                          className="input-field py-2 text-xs font-bold text-center"
                          title="Passing Marks"
                          required 
                        />
                      </div>

                      <div className="md:col-span-1 flex justify-end">
                        {form.subjects.length > 1 ? (
                          <button 
                            type="button" 
                            onClick={() => removeSubject(i)} 
                            className="p-2.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 rounded-xl transition-all shadow-sm flex items-center justify-center h-10 w-full md:w-10 shrink-0 cursor-pointer"
                            title="Remove Subject"
                          >
                            ✕
                          </button>
                        ) : (
                          <div className="h-10 w-full md:w-10" />
                        )}
                      </div>
                    </div>
                  ))}
                  {form.subjects.length === 0 && (
                    <p className="text-xs text-white/30 italic pl-1 text-center py-4">No subjects added. Click "+ Add Subject Row" to schedule a paper.</p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-3 border-t border-white/5">
                <button 
                  type="submit" 
                  className="btn-primary flex-1 justify-center py-3 font-bold tracking-wide shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Create Examination & Notify
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="btn-secondary flex-1 justify-center py-3 font-bold tracking-wide cursor-pointer"
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

export default Exams;
