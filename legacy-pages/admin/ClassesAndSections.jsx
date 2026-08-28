import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiCheckCircle, HiXCircle } from 'react-icons/hi';

const ClassesAndSections = () => {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [loading, setLoading] = useState(true);

  // Form toggle states
  const [showClassForm, setShowClassForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);

  // Form input states
  const [classForm, setClassForm] = useState({ name: '' });
  const [sectionForm, setSectionForm] = useState({ class_id: '', group_id: '', name: '', capacity: 40 });
  const [groupForm, setGroupForm] = useState({ class_id: '', name: '', isActive: true });

  // Selected class filter for Group Management
  const [selectedClassForGroups, setSelectedClassForGroups] = useState('');

  // Editing modal states
  const [editingClass, setEditingClass] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);

  const fetchData = async (sessionId) => {
    try {
      const [clsRes, secRes, grpRes] = await Promise.all([
        api.get(`/classes?session_id=${sessionId}`),
        api.get(`/sections?session_id=${sessionId}`),
        api.get('/groups')
      ]);
      setClasses(clsRes.data.data);
      setSections(secRes.data.data);
      setGroupsList(grpRes.data.data);

      if (clsRes.data.data.length > 0 && !selectedClassForGroups) {
        setSelectedClassForGroups(clsRes.data.data[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const { data } = await api.get('/sessions');
        setSessions(data.data);
        const current = data.data.find(s => s.isCurrent);
        if (current) {
          setSelectedSession(current._id);
          fetchData(current._id);
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) fetchData(selectedSession);
  }, [selectedSession]);

  // Class Actions
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!classForm.name.trim()) return toast.error('Class name is required');
    try {
      await api.post('/classes', { ...classForm, session_id: selectedSession, groups: [] });
      toast.success('Class created successfully');
      setClassForm({ name: '' });
      setShowClassForm(false);
      fetchData(selectedSession);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating class');
    }
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/classes/${editingClass._id}`, {
        name: editingClass.name,
        isActive: editingClass.isActive
      });
      toast.success('Class updated successfully');
      setEditingClass(null);
      fetchData(selectedSession);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating class');
    }
  };

  const handleDeleteClass = async (id) => {
    if (!confirm('Are you sure you want to delete this class? This will fail if sections or groups are associated.')) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Class deleted successfully');
      fetchData(selectedSession);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting class. Ensure it has no linked data.');
    }
  };

  // Group Actions
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const classId = groupForm.class_id || selectedClassForGroups;
    if (!classId) return toast.error('Please select a class for the group');
    if (!groupForm.name.trim()) return toast.error('Group name is required');

    try {
      await api.post('/groups', {
        class_id: classId,
        name: groupForm.name,
        isActive: groupForm.isActive
      });
      toast.success('Academic Group created successfully');
      setGroupForm({ class_id: classId, name: '', isActive: true });
      setShowGroupForm(false);
      fetchData(selectedSession);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating group');
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/groups/${editingGroup._id}`, {
        class_id: editingGroup.class_id,
        name: editingGroup.name,
        isActive: editingGroup.isActive
      });
      toast.success('Group updated successfully');
      setEditingGroup(null);
      fetchData(selectedSession);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating group');
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!confirm('Are you sure you want to delete this group? It must not be assigned to any active sections.')) return;
    try {
      await api.delete(`/groups/${id}`);
      toast.success('Group deleted successfully');
      fetchData(selectedSession);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting group');
    }
  };

  // Section Actions
  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!sectionForm.class_id) return toast.error('Class selection is required');
    if (!sectionForm.group_id) return toast.error('Group selection is required');
    if (!sectionForm.name.trim()) return toast.error('Section name is required');

    const upperName = sectionForm.name.trim().toUpperCase();
    try {
      await api.post('/sections', {
        ...sectionForm,
        name: upperName,
        code: upperName,      // keep code in sync for backward compatibility
        session_id: selectedSession
      });
      toast.success('Section created successfully');
      setSectionForm({ class_id: '', group_id: '', name: '', capacity: 40 });
      setShowSectionForm(false);
      fetchData(selectedSession);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating section');
    }
  };

  const handleUpdateSection = async (e) => {
    e.preventDefault();
    if (!editingSection.name?.trim()) return toast.error('Section name is required');
    const upperName = editingSection.name.trim().toUpperCase();
    try {
      await api.put(`/sections/${editingSection._id}`, {
        class_id: editingSection.class_id,
        group_id: editingSection.group_id,
        name: upperName,
        code: upperName,      // keep code in sync for backward compatibility
        capacity: editingSection.capacity,
        isActive: editingSection.isActive
      });
      toast.success('Section updated successfully');
      setEditingSection(null);
      fetchData(selectedSession);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating section');
    }
  };

  const handleDeleteSection = async (id) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    try {
      await api.delete(`/sections/${id}`);
      toast.success('Section deleted successfully');
      fetchData(selectedSession);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting section');
    }
  };

  const startEditClass = (c) => {
    setEditingClass({ ...c });
  };

  const startEditSection = (s) => {
    setEditingSection({
      ...s,
      class_id: s.class_id?._id || s.class_id?.id || s.class_id,
      group_id: s.group_id?._id || s.group_id?.id || s.group_id
    });
  };

  const startEditGroup = (g) => {
    setEditingGroup({ ...g });
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Classes, Groups & Sections</h1>
          <p className="text-xs text-white/50">Manage dynamic academic parts, student streams/groups, and sections with capacity thresholds.</p>
        </div>
        <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none shadow-md">
          {sessions.map(s => <option key={s._id} value={s._id}>{s.name}{s.isCurrent ? ' (Current)' : ''}</option>)}
        </select>
      </div>

      {/* Main Grid: Parts/Classes & Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parts / Classes Section */}
        <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Classes (Parts)</h2>
              <p className="text-[10px] text-white/40">Manage dynamic academic divisions/parts (e.g. Part 1, Part 2).</p>
            </div>
            <button onClick={() => setShowClassForm(!showClassForm)} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-1 rounded-md transition-all">
              <HiPlus size={14} /> Add Class
            </button>
          </div>

          {showClassForm && (
            <form onSubmit={handleCreateClass} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-3 animate-fadeIn">
              <div>
                <label className="block text-[10px] text-white/50 uppercase mb-1">Class/Part Name</label>
                <input
                  type="text"
                  value={classForm.name}
                  onChange={e => setClassForm({ name: e.target.value })}
                  placeholder="e.g. FSC Part 1, BSCS 1st Year"
                  required
                  className="w-full px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-md">Create Class</button>
                <button type="button" onClick={() => setShowClassForm(false)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-semibold rounded-lg transition">Cancel</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {classes.map(c => (
              <div key={c._id} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition flex flex-col justify-between shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-white">{c.name}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => startEditClass(c)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium">Edit</button>
                      <button onClick={() => handleDeleteClass(c._id)} className="text-[10px] text-rose-400 hover:text-rose-300 font-medium">Delete</button>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {groupsList.filter(g => g.class_id === c._id).map(g => (
                      <span key={g._id} className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${g.isActive ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/5 text-white/30'}`}>
                        {g.name}
                      </span>
                    ))}
                    {groupsList.filter(g => g.class_id === c._id).length === 0 && (
                      <span className="text-[10px] text-white/30 italic">No groups created</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-white/30 border-t border-white/[0.03] pt-2">
                  Sections: {sections.filter(s => s.class_id?._id === c._id || s.class_id === c._id).map(s => `${s.code}`).join(', ') || 'None'}
                </div>
              </div>
            ))}
            {classes.length === 0 && <p className="text-white/30 text-xs py-4 col-span-2 text-center">No classes created yet. Use the button above to start.</p>}
          </div>
        </div>

        {/* Academic Streams / Groups Section */}
        <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Groups under Class</h2>
              <p className="text-[10px] text-white/40">Manage dynamic academic streams / groups (e.g. Computer Science, Pre-Medical).</p>
            </div>
            <button
              onClick={() => {
                if (!selectedClassForGroups) return toast.error('Create a class first');
                setGroupForm(prev => ({ ...prev, class_id: selectedClassForGroups }));
                setShowGroupForm(!showGroupForm);
              }}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-1 rounded-md transition-all"
            >
              <HiPlus size={14} /> Add Group
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60">Class Focus:</span>
            <select
              value={selectedClassForGroups}
              onChange={e => {
                setSelectedClassForGroups(e.target.value);
                setGroupForm(prev => ({ ...prev, class_id: e.target.value }));
              }}
              className="px-2 py-1 bg-[#1a2230] border border-white/10 rounded-md text-white text-xs outline-none"
            >
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              {classes.length === 0 && <option value="">No Classes Available</option>}
            </select>
          </div>

          {showGroupForm && (
            <form onSubmit={handleCreateGroup} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-3 animate-fadeIn">
              <div>
                <label className="block text-[10px] text-white/50 uppercase mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="e.g. Computer Science, Pre-Medical, Pre-Engineering"
                  required
                  className="w-full px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="groupIsActive"
                  checked={groupForm.isActive}
                  onChange={e => setGroupForm({ ...groupForm, isActive: e.target.checked })}
                  className="rounded bg-[#1a2230] border-white/10 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="groupIsActive" className="text-xs text-white/60 cursor-pointer">Active Stream</label>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-md">Create Group</button>
                <button type="button" onClick={() => setShowGroupForm(false)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-semibold rounded-lg transition">Cancel</button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {groupsList.filter(g => g.class_id === selectedClassForGroups).map(g => (
              <div key={g._id} className="px-4 py-2.5 rounded-lg bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.02] transition flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${g.isActive ? 'bg-emerald-500 shadow-md shadow-emerald-500/40' : 'bg-white/20'}`} />
                  <span className="text-xs font-semibold text-white/90">{g.name}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => startEditGroup(g)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium">Edit</button>
                  <button onClick={() => handleDeleteGroup(g._id)} className="text-[10px] text-rose-400 hover:text-rose-300 font-medium">Delete</button>
                </div>
              </div>
            ))}
            {groupsList.filter(g => g.class_id === selectedClassForGroups).length === 0 && (
              <p className="text-white/30 text-xs py-6 text-center italic">No groups found under this Class. Add a group to host sections.</p>
            )}
          </div>
        </div>
      </div>

      {/* Sections Row */}
      <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Sections Configuration</h2>
            <p className="text-xs text-white/40">Sections are bound to specific academic groups under classes with custom capacities.</p>
          </div>
          <button onClick={() => setShowSectionForm(!showSectionForm)} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-1 rounded-md transition-all">
            <HiPlus size={14} /> Add Section
          </button>
        </div>

        {showSectionForm && (
          <form onSubmit={handleCreateSection} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05] grid grid-cols-1 md:grid-cols-5 gap-3 animate-fadeIn">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-white/50 uppercase font-semibold">1. Choose Class</label>
              <select
                value={sectionForm.class_id}
                onChange={e => setSectionForm({ ...sectionForm, class_id: e.target.value, group_id: '' })}
                required
                className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-xs outline-none"
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-white/50 uppercase font-semibold">2. Choose Group</label>
              <select
                value={sectionForm.group_id}
                onChange={e => setSectionForm({ ...sectionForm, group_id: e.target.value })}
                required
                disabled={!sectionForm.class_id}
                className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-xs outline-none disabled:opacity-40 transition"
              >
                <option value="">Select Group</option>
                {groupsList.filter(g => g.class_id === sectionForm.class_id).map(g => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-white/50 uppercase font-semibold">3. Section Name <span className="text-indigo-400">(Key Code)</span></label>
              <input
                value={sectionForm.name}
                onChange={e => setSectionForm({ ...sectionForm, name: e.target.value.toUpperCase() })}
                placeholder="e.g. A, LIONS, CS-1"
                required
                maxLength={20}
                className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-xs outline-none uppercase tracking-wider font-bold placeholder:normal-case placeholder:font-normal"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-white/50 uppercase font-semibold">4. Max Capacity</label>
              <input
                type="number"
                value={sectionForm.capacity}
                onChange={e => setSectionForm({ ...sectionForm, capacity: parseInt(e.target.value, 10) || 40 })}
                placeholder="Max Students"
                required
                min="1"
                className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-xs outline-none"
              />
            </div>

            <div className="md:col-span-4 flex justify-end gap-2 pt-2 border-t border-white/[0.03]">
              <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-md">Create Section</button>
              <button type="button" onClick={() => setShowSectionForm(false)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-semibold rounded-lg transition">Cancel</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/40 uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Section Name</th>
                <th className="px-4 py-3 font-semibold">Class (Part)</th>
                <th className="px-4 py-3 font-semibold">Academic Group</th>
                <th className="px-4 py-3 font-semibold">Capacity</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {sections.map(s => (
                <tr key={s._id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-white font-bold tracking-widest uppercase">{s.name || s.code}</span>
                  </td>
                  <td className="px-4 py-3 text-white/80">{s.class_id?.name || <span className="text-white/20 italic">No Class</span>}</td>
                  <td className="px-4 py-3 text-white/80">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 font-semibold rounded-full text-[10px]">
                      {s.group_id?.name || <span className="text-white/20 italic">No Group</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/60 font-semibold">{s.capacity || '40'} Students</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.isActive !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {s.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => startEditSection(s)} className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 transition"><HiPencil size={12} /> Edit</button>
                      <button onClick={() => handleDeleteSection(s._id)} className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-0.5 transition"><HiTrash size={12} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {sections.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-white/30">No sections found. Use the form above to add sections for dynamic streams.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="modal-overlay" onClick={() => setEditingClass(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Edit Class Name</h2>
            <form onSubmit={handleUpdateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Class / Part Name</label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={e => setEditingClass({ ...editingClass, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editClassIsActive"
                  checked={editingClass.isActive !== false}
                  onChange={e => setEditingClass({ ...editingClass, isActive: e.target.checked })}
                  className="rounded bg-[#1a2230] border-white/10 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="editClassIsActive" className="text-xs text-white/60 cursor-pointer">Active Class</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-lg">Save Changes</button>
                <button type="button" onClick={() => setEditingClass(null)} className="flex-1 px-4 py-2.5 bg-[#1a2230] border border-white/10 hover:bg-white/[0.04] text-white text-sm font-semibold rounded-xl transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="modal-overlay" onClick={() => setEditingGroup(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Edit Academic Group</h2>
            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Class Binding</label>
                <select
                  value={editingGroup.class_id}
                  onChange={e => setEditingGroup({ ...editingGroup, class_id: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none"
                >
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Group / Stream Name</label>
                <input
                  type="text"
                  value={editingGroup.name}
                  onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editGroupIsActive"
                  checked={editingGroup.isActive !== false}
                  onChange={e => setEditingGroup({ ...editingGroup, isActive: e.target.checked })}
                  className="rounded bg-[#1a2230] border-white/10 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="editGroupIsActive" className="text-xs text-white/60 cursor-pointer">Active Group</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-lg">Save Changes</button>
                <button type="button" onClick={() => setEditingGroup(null)} className="flex-1 px-4 py-2.5 bg-[#1a2230] border border-white/10 hover:bg-white/[0.04] text-white text-sm font-semibold rounded-xl transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="modal-overlay" onClick={() => setEditingSection(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Edit Section</h2>
            <form onSubmit={handleUpdateSection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Class / Part</label>
                <select
                  value={editingSection.class_id}
                  onChange={e => setEditingSection({ ...editingSection, class_id: e.target.value, group_id: '' })}
                  required
                  className="w-full px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none"
                >
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Academic Group</label>
                <select
                  value={editingSection.group_id}
                  onChange={e => setEditingSection({ ...editingSection, group_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none"
                >
                  <option value="">Select Group</option>
                  {groupsList.filter(g => g.class_id === editingSection.class_id).map(g => (
                    <option key={g._id} value={g._id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Section Name <span className="text-indigo-400">(Key Code)</span></label>
                <input
                  value={editingSection.name || ''}
                  onChange={e => setEditingSection({ ...editingSection, name: e.target.value.toUpperCase() })}
                  placeholder="e.g. A, LIONS, CS-1"
                  required
                  maxLength={20}
                  className="w-full px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none uppercase tracking-widest font-bold placeholder:normal-case placeholder:font-normal"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Max Capacity</label>
                <input
                  type="number"
                  value={editingSection.capacity || ''}
                  onChange={e => setEditingSection({ ...editingSection, capacity: parseInt(e.target.value, 10) || 0 })}
                  placeholder="Capacity limit"
                  required
                  className="w-full px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editSectionIsActive"
                  checked={editingSection.isActive !== false}
                  onChange={e => setEditingSection({ ...editingSection, isActive: e.target.checked })}
                  className="rounded bg-[#1a2230] border-white/10 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="editSectionIsActive" className="text-xs text-white/60 cursor-pointer">Active Section</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-lg">Save Changes</button>
                <button type="button" onClick={() => setEditingSection(null)} className="flex-1 px-4 py-2.5 bg-[#1a2230] border border-white/10 hover:bg-white/[0.04] text-white text-sm font-semibold rounded-xl transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesAndSections;
