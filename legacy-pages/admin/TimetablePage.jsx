import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar, HiOutlinePlus, HiOutlineRefresh, HiOutlinePrinter,
  HiOutlineChevronDown, HiOutlineSearch, HiOutlineSave, HiOutlineEye
} from 'react-icons/hi';
import TimingSetup from '../../components/timetable/TimingSetup';
import SlotGrid from '../../components/timetable/SlotGrid';
import TimetableViewer from '../../components/timetable/TimetableViewer';

const TimetablePage = () => {
  const [tab, setTab] = useState('view');
  const [timetables, setTimetables] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  // Builder state
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [slots, setSlots] = useState([]);
  const [grid, setGrid] = useState({});
  const [sameDays, setSameDays] = useState(false);

  // Preset state
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [presetName, setPresetName] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ttRes, clsRes, secRes, subRes, tchRes, grpRes, presetRes] = await Promise.all([
        api.get('/timetables').catch(() => ({ data: { data: [] } })),
        api.get('/classes').catch(() => ({ data: { data: [] } })),
        api.get('/sections').catch(() => ({ data: { data: [] } })),
        api.get('/subjects').catch(() => ({ data: { data: [] } })),
        api.get('/teachers').catch(() => ({ data: { data: [] } })),
        api.get('/groups').catch(() => ({ data: { data: [] } })),
        api.get('/universal-timetables').catch(() => ({ data: { data: [] } })),
      ]);
      setTimetables(ttRes.data.data || []);
      setClasses(clsRes.data.data || []);
      setSections(secRes.data.data || []);
      setAllSubjects(subRes.data.data || []);
      setSubjects(subRes.data.data || []);
      setTeachers(tchRes.data.data || []);
      setGroups(grpRes.data.data || []);
      setPresets(presetRes.data.data || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  // Filter sections by selected class
  const filteredSections = selectedClass
    ? sections.filter(s => {
        const clsId = s.class_id?._id || s.class_id;
        return clsId === selectedClass;
      })
    : sections;

  // Filter subjects by selected section's class and group
  useEffect(() => {
    if (!selectedSection || !selectedClass) {
      setSubjects(allSubjects);
      return;
    }
    const sectionObj = sections.find(s => (s._id || s.id) === selectedSection);
    const classObj = classes.find(c => (c._id || c.id) === selectedClass);
    const className = classObj?.name || '';

    // Find section's group
    let groupName = '';
    if (sectionObj?.group_id) {
      const grpId = typeof sectionObj.group_id === 'object' ? sectionObj.group_id._id || sectionObj.group_id.id : sectionObj.group_id;
      const grpObj = groups.find(g => (g._id || g.id) === grpId);
      groupName = grpObj?.name || (typeof sectionObj.group_id === 'object' ? sectionObj.group_id.name : '');
    }

    const filtered = allSubjects.filter(sub => {
      // Class match: subject class matches selected class name, or is 'Both', or is null
      const subClass = sub.class || '';
      const classMatch = !subClass || subClass === 'Both' || subClass === className;

      // Group match: subject group contains the group name, or is 'Common'
      const subGroup = sub.group || '';
      const groupMatch = !groupName || subGroup === 'Common' || subGroup.toLowerCase().includes(groupName.toLowerCase());

      return classMatch && groupMatch;
    });

    setSubjects(filtered);
  }, [selectedSection, selectedClass, allSubjects, sections, classes, groups]);

  // Save preset
  const handleSavePreset = async () => {
    if (!presetName) return toast.error('Enter a preset name');
    if (!fromDate || !toDate) return toast.error('Set from and to dates');
    if (slots.length === 0) return toast.error('Add at least one slot');

    try {
      if (selectedPreset) {
        await api.put(`/universal-timetables/${selectedPreset}`, { name: presetName, fromDate, toDate, slots });
        toast.success('Preset updated!');
      } else {
        const res = await api.post('/universal-timetables', { name: presetName, fromDate, toDate, slots });
        setSelectedPreset(res.data.data._id || res.data.data.id);
        toast.success('Preset saved!');
      }
      const presetRes = await api.get('/universal-timetables').catch(() => ({ data: { data: [] } }));
      setPresets(presetRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save preset');
    }
  };

  // Delete preset
  const handleDeletePreset = async () => {
    if (!selectedPreset) return;
    try {
      await api.delete(`/universal-timetables/${selectedPreset}`);
      toast.success('Preset deleted');
      setSelectedPreset('');
      setPresetName('');
      setFromDate('');
      setToDate('');
      setSlots([]);
      const presetRes = await api.get('/universal-timetables').catch(() => ({ data: { data: [] } }));
      setPresets(presetRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete preset');
    }
  };

  // Save timetable
  const handleSave = async () => {
    if (!selectedClass || !selectedSection) {
      return toast.error('Select class and section first');
    }
    const periodSlots = slots.filter(s => s.type === 'class' || s.type === 'period');
    if (periodSlots.length === 0) return toast.error('Add at least one period slot');

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const classObj = classes.find(c => (c._id || c.id) === selectedClass);
    const sectionObj = sections.find(s => (s._id || s.id) === selectedSection);
    const className = classObj ? classObj.name : '';
    const sectionCode = sectionObj ? (sectionObj.code || sectionObj.name) : '';

    const entries = [];
    for (const day of days) {
      const sourceDay = sameDays ? 'Monday' : day;
      const periods = slots.map((slot, index) => {
        const isGap = ['break', 'sports_gap', 'nazira_gap', 'assembly_gap', 'function_gap'].includes(slot.type);
        if (isGap) {
          return {
            periodNumber: slot.id || (index + 1),
            isBreak: slot.type === 'break',
            type: slot.type,
            label: slot.label,
            startTime: slot.startTime,
            endTime: slot.endTime
          };
        }
        const assignment = grid[`${sourceDay}_${slot.id}`];
        return {
          periodNumber: slot.id || (index + 1),
          isBreak: false,
          type: 'class',
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject_id: assignment?.subjectId || null,
          teacher_id: assignment?.teacherId || null,
          label: slot.label
        };
      });
      entries.push({
        day,
        class_id: selectedClass,
        section_id: selectedSection,
        class: className,
        section: sectionCode,
        universal_timetable_id: selectedPreset || null,
        periods
      });
    }

    setSaving(true);
    try {
      await api.post('/timetables/bulk', { entries });
      toast.success('Timetable saved!');
      setTab('view');
      setGrid({});
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  // Unique class names for view filter
  const uniqueClassNames = [...new Set(timetables.map(t => t.class || t.class_id?.name).filter(Boolean))];

  // Filtered timetables
  let filteredTimetables = timetables;
  if (filterClass !== 'all') {
    filteredTimetables = filteredTimetables.filter(t => (t.class || t.class_id?.name) === filterClass);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredTimetables = filteredTimetables.filter(t =>
      (t.class || t.class_id?.name || '').toLowerCase().includes(q) ||
      (t.section || t.section_id?.code || '').toLowerCase().includes(q)
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-indigo-200 dark:border-indigo-500/20 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-white/30">Loading timetable...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Timetable</h1>
          <p className="text-xs text-gray-500 dark:text-white/35 mt-0.5">Build and view weekly class schedules with universal presets</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="p-2 rounded-lg text-gray-500 dark:text-white/30 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-white/[0.04] transition" title="Refresh">
            <HiOutlineRefresh size={17} />
          </button>
          <button onClick={() => window.print()} className="p-2 rounded-lg text-gray-500 dark:text-white/30 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-white/[0.04] transition" title="Print">
            <HiOutlinePrinter size={17} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-white/[0.04] rounded-xl p-1 w-fit">
        <button onClick={() => setTab('view')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            tab === 'view' ? 'bg-white dark:bg-[#0d1117] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-white/35 hover:text-gray-700 dark:hover:text-white/60'
          }`}>
          <HiOutlineEye size={14} /> View Timetables
        </button>
        <button onClick={() => setTab('create')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            tab === 'create' ? 'bg-white dark:bg-[#0d1117] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-white/35 hover:text-gray-700 dark:hover:text-white/60'
          }`}>
          <HiOutlinePlus size={14} /> Create Timetable
        </button>
      </div>

      {/* ══════ CREATE TAB ══════ */}
      {tab === 'create' && (
        <div className="space-y-5">
          {/* Section Selector */}
          <div className="rounded-xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/[0.06] p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">🎯 Select Class & Section</h3>
            <div className="flex flex-wrap gap-3">
              <div className="relative min-w-[180px]">
                <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); }}
                  className="appearance-none w-full pl-3 pr-8 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white/80 text-sm cursor-pointer focus:outline-none focus:border-indigo-500 transition">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                </select>
                <HiOutlineChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
              </div>
              <div className="relative min-w-[180px]">
                <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
                  disabled={!selectedClass}
                  className="appearance-none w-full pl-3 pr-8 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white/80 text-sm cursor-pointer focus:outline-none focus:border-indigo-500 transition disabled:opacity-40">
                  <option value="">Select Section</option>
                  {filteredSections.map(s => {
                    const grp = typeof s.group_id === 'object' ? s.group_id?.name : '';
                    return <option key={s._id || s.id} value={s._id || s.id}>{s.code || s.name}{grp ? ` (${grp})` : ''}</option>;
                  })}
                </select>
                <HiOutlineChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
              </div>
              {selectedClass && selectedSection && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium">
                  ✓ Ready — {subjects.length} subjects available
                </span>
              )}
            </div>
          </div>

          {/* Timing Setup */}
          <TimingSetup
            slots={slots} setSlots={setSlots}
            presets={presets} selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset}
            onSavePreset={handleSavePreset} onDeletePreset={handleDeletePreset}
            presetName={presetName} setPresetName={setPresetName}
            fromDate={fromDate} setFromDate={setFromDate}
            toDate={toDate} setToDate={setToDate}
          />

          {/* Slot Grid */}
          {selectedClass && selectedSection && slots.filter(s => s.type === 'class' || s.type === 'period').length > 0 && (
            <SlotGrid
              slots={slots} subjects={subjects} teachers={teachers}
              grid={grid} setGrid={setGrid}
              sameDays={sameDays} setSameDays={setSameDays}
            />
          )}

          {/* Save Button */}
          {selectedClass && selectedSection && Object.keys(grid).length > 0 && (
            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                <HiOutlineSave size={16} />
                {saving ? 'Saving...' : 'Save Timetable'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════ VIEW TAB ══════ */}
      {tab === 'view' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/25" size={15} />
              <input type="text" placeholder="Search class or section..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white/80 text-sm placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-indigo-500 transition" />
            </div>
            <div className="relative">
              <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                className="appearance-none pl-3 pr-9 py-2 rounded-lg bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white/80 text-sm cursor-pointer focus:outline-none focus:border-indigo-500 transition">
                <option value="all">All Classes</option>
                {uniqueClassNames.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
            </div>
            <div className="flex bg-gray-100 dark:bg-white/[0.04] rounded-lg p-1">
              {['grid', 'compact'].map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition capitalize ${
                    viewMode === m ? 'bg-white dark:bg-[#0d1117] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-white/35'
                  }`}>{m}</button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              [timetables.length, 'Total Entries'],
              [uniqueClassNames.length, 'Classes'],
              [presets.length, 'Presets'],
              [timetables.filter(t => t.periods?.some(p => !p.isBreak && p.type !== 'break')).length, 'Active Periods']
            ].map(([val, label], i) => (
              <div key={i} className="rounded-xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/[0.06] p-3">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{val}</p>
                <p className="text-[10px] text-gray-500 dark:text-white/25">{label}</p>
              </div>
            ))}
          </div>

          {/* Timetable Display */}
          <TimetableViewer timetables={filteredTimetables} viewMode={viewMode} role="admin" teachers={teachers} onRefresh={fetchAll} />
        </div>
      )}
    </div>
  );
};

export default TimetablePage;