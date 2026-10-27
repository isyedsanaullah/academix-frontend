'use client';

import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineBookOpen,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineCheckCircle,
  HiOutlineExclamation
} from 'react-icons/hi';

const GroupSubjects = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Add/Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    subject_id: '',
    kind: 'compulsory',
    electiveSet: '',
    maxChoices: 1
  });
  const [saving, setSaving] = useState(false);

  // Load groups and all subjects on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [grpRes, subRes] = await Promise.all([
          api.get('/groups'),
          api.get('/subjects')
        ]);
        const grpList = grpRes.data.data || [];
        setGroups(grpList);
        setAllSubjects(subRes.data.data || []);

        if (grpList.length > 0) {
          setSelectedGroupId(grpList[0]._id || grpList[0].id);
        }
      } catch (err) {
        toast.error('Failed to load academic groups');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Fetch subjects for selected group
  const fetchGroupSubjects = async (groupId) => {
    if (!groupId) return;
    setLoadingSubjects(true);
    try {
      const { data } = await api.get(`/groups/${groupId}/subjects`);
      setSubjects(data.data || []);
    } catch (err) {
      toast.error('Failed to load subject combinations for group');
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupSubjects(selectedGroupId);
    }
  }, [selectedGroupId]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      subject_id: allSubjects[0]?._id || allSubjects[0]?.id || '',
      kind: 'compulsory',
      electiveSet: '',
      maxChoices: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (gs) => {
    setEditingId(gs.id || gs._id);
    setForm({
      subject_id: gs.subject_id,
      kind: gs.kind || 'compulsory',
      electiveSet: gs.electiveSet || '',
      maxChoices: gs.maxChoices || 1
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject_id) return toast.error('Please select a subject');

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/groups/${selectedGroupId}/subjects/${editingId}`, {
          kind: form.kind,
          electiveSet: form.kind === 'elective' ? form.electiveSet : null,
          maxChoices: form.kind === 'elective' ? parseInt(form.maxChoices, 10) : null
        });
        toast.success('Subject configuration updated');
      } else {
        await api.post(`/groups/${selectedGroupId}/subjects`, {
          subject_id: form.subject_id,
          kind: form.kind,
          electiveSet: form.kind === 'elective' ? form.electiveSet : null,
          maxChoices: form.kind === 'elective' ? parseInt(form.maxChoices, 10) : null
        });
        toast.success('Subject added to group combination');
      }
      setShowModal(false);
      fetchGroupSubjects(selectedGroupId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save subject configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this subject from the group combination?')) return;
    try {
      await api.delete(`/groups/${selectedGroupId}/subjects/${id}`);
      toast.success('Subject removed from group');
      fetchGroupSubjects(selectedGroupId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove subject');
    }
  };

  const currentGroup = groups.find(g => (g._id || g.id) === selectedGroupId);

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        Loading subject combination center...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Bar: Group Selector and Action */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <HiOutlineBookOpen size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Subject Combinations per Group</h2>
            <p className="text-xs text-slate-500 dark:text-white/40">
              Define compulsory and elective subject bundles enforced during student enrollment and transfer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
          >
            {groups.map(g => (
              <option key={g._id || g.id} value={g._id || g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenAdd}
            disabled={!selectedGroupId}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
          >
            <HiOutlinePlus size={16} />
            Add Subject
          </button>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-white/70">
            Configured Subjects for &quot;{currentGroup?.name || 'Group'}&quot; ({subjects.length})
          </span>
        </div>

        {loadingSubjects ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading group subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <HiOutlineExclamation size={28} className="mx-auto text-slate-300 dark:text-white/20" />
            <p className="text-sm font-semibold text-slate-700 dark:text-white/70">No subjects configured yet</p>
            <p className="text-xs text-slate-400 dark:text-white/40">
              Click &quot;Add Subject&quot; above to configure compulsory or elective subjects for this group.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-white/40 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Requirement Kind</th>
                  <th className="py-3 px-4">Elective Set</th>
                  <th className="py-3 px-4">Max Choices</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {subjects.map(gs => {
                  let badge = { label: 'Compulsory', bg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' };
                  if (gs.kind === 'elective') {
                    badge = { label: 'Elective', bg: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' };
                  } else if (gs.kind === 'optional') {
                    badge = { label: 'Optional', bg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' };
                  }

                  return (
                    <tr key={gs.id || gs._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {gs.subject?.name || 'Unnamed Subject'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-white/50">
                        {gs.subject?.code || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-white/60">
                        {gs.electiveSet || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-white/60">
                        {gs.kind === 'elective' ? (gs.maxChoices || 1) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(gs)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                            title="Edit rule"
                          >
                            <HiOutlinePencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(gs.id || gs._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                            title="Remove"
                          >
                            <HiOutlineTrash size={15} />
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/[0.08] shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingId ? 'Edit Group Subject' : 'Add Subject to Group'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-white/40 mb-1">
                  Subject
                </label>
                <select
                  disabled={!!editingId}
                  value={form.subject_id}
                  onChange={e => setForm({ ...form, subject_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                >
                  {allSubjects.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name} ({s.code || 'No code'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-white/40 mb-1">
                  Requirement Kind
                </label>
                <select
                  value={form.kind}
                  onChange={e => setForm({ ...form, kind: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="compulsory">Compulsory (Must be assigned to all students)</option>
                  <option value="elective">Elective (Student picks from a set)</option>
                  <option value="optional">Optional</option>
                </select>
              </div>

              {form.kind === 'elective' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-white/40 mb-1">
                      Elective Set Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. science-elective, language-set"
                      value={form.electiveSet}
                      onChange={e => setForm({ ...form, electiveSet: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-white/40 mb-1">
                      Max Choices From This Set
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.maxChoices}
                      onChange={e => setForm({ ...form, maxChoices: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupSubjects;
