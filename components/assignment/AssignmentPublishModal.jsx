import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUpload,
  HiOutlineDocumentText,
  HiOutlineDesktopComputer,
  HiOutlineFolderOpen,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineSave
} from 'react-icons/hi';

const SUBMISSION_METHOD_OPTIONS = [
  { id: 'notebook', label: '✍️ Handwritten Notebook', rules: 'Submit physical notebook during lab hours.' },
  { id: 'hardcopy', label: '📄 Printed Hard Copy', rules: 'Submit single-sided printed paper at Department Office.' },
  { id: 'pdf', label: '📥 PDF Upload', rules: 'Max 10MB PDF document.' },
  { id: 'docx', label: '📝 DOCX Upload', rules: 'Microsoft Word format.' },
  { id: 'ppt', label: '📊 PPT Upload', rules: 'PowerPoint presentation slides.' },
  { id: 'image', label: '🖼️ Image Upload', rules: 'Clear JPG/PNG page scans.' },
  { id: 'zip', label: '📦 ZIP Upload', rules: 'Compressed archive containing code/project.' },
  { id: 'code', label: '💻 Source Code Upload', rules: 'Raw .cpp, .java, .py, or .js files.' },
  { id: 'github', label: '🔗 GitHub Repository Link', rules: 'Public GitHub repository URL.' },
  { id: 'gdrive', label: '☁️ Google Drive Link', rules: 'Shared link with viewing permissions.' },
  { id: 'presentation', label: '🎤 Presentation', rules: '5-minute in-person slide presentation.' },
  { id: 'viva', label: '🗣️ Viva Voice', rules: '1-on-1 oral examination.' },
  { id: 'demo', label: '⚙️ Practical Demonstration', rules: 'Live working demonstration in computer lab.' }
];

export default function AssignmentPublishModal({
  assignmentData,
  onClose,
  onPublishSuccess
}) {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: assignmentData?.title || '',
    subject_id: assignmentData?.subject_id || '',
    class_id: assignmentData?.class_id || '',
    section_id: assignmentData?.section_id || 'all',
    dueDate: assignmentData?.dueDate || '',
    totalMarks: assignmentData?.totalMarks || 20,
    estimatedTime: assignmentData?.estimatedTime || '60 Mins',
    status: 'published', // draft | scheduled | published | archived
    selectedMethods: assignmentData?.submissionMethods || [
      { id: 'pdf', label: '📥 PDF Upload', instructions: 'Max 10MB PDF document.' }
    ]
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cRes, secRes, subRes] = await Promise.all([
          api.get('/classes').catch(() => ({ data: { data: [] } })),
          api.get('/sections').catch(() => ({ data: { data: [] } })),
          api.get('/subjects').catch(() => ({ data: { data: [] } }))
        ]);
        setClasses(cRes.data.data || []);
        setSections(secRes.data.data || []);
        setSubjects(subRes.data.data || []);
      } catch (e) {}
    };
    fetchMetadata();
  }, []);

  const toggleMethod = (method) => {
    const exists = form.selectedMethods.some(m => m.id === method.id);
    if (exists) {
      setForm({ ...form, selectedMethods: form.selectedMethods.filter(m => m.id !== method.id) });
    } else {
      setForm({
        ...form,
        selectedMethods: [...form.selectedMethods, { id: method.id, label: method.label, instructions: method.rules }]
      });
    }
  };

  const updateMethodInstructions = (methodId, newInstructions) => {
    const updated = form.selectedMethods.map(m => {
      if (m.id === methodId) return { ...m, instructions: newInstructions };
      return m;
    });
    setForm({ ...form, selectedMethods: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Please enter a title');
    if (!form.dueDate) return toast.error('Please select a deadline');

    setLoading(true);
    try {
      const payload = {
        ...assignmentData,
        ...form,
        submissionMethods: form.selectedMethods
      };

      await api.post('/assignments', payload);
      toast.success('Assignment published successfully to target section(s)!');
      if (onPublishSuccess) onPublishSuccess();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-white font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <HiOutlineDocumentText className="text-indigo-400" /> Publish & Configure Assignment
            </h2>
            <p className="text-xs text-white/50">Target assigned classes, submission rules, and availability status</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Audience & Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/[0.06] text-xs">
            <div className="md:col-span-3">
              <label className="block font-semibold text-white/60 mb-1">Assignment Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-white/60 mb-1">Class *</label>
              <select
                value={form.class_id}
                onChange={e => setForm({ ...form, class_id: e.target.value })}
                className="w-full p-2 bg-[#161b22] border border-white/10 rounded-lg text-xs text-white"
                required
              >
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-white/60 mb-1">Subject</label>
              <select
                value={form.subject_id}
                onChange={e => setForm({ ...form, subject_id: e.target.value })}
                className="w-full p-2 bg-[#161b22] border border-white/10 rounded-lg text-xs text-white"
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-white/60 mb-1">Submission Deadline *</label>
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                required
              />
            </div>

            <div className="md:col-span-3">
              <label className="block font-semibold text-white/60 mb-1">Target Section(s)</label>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, section_id: 'all' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    !form.section_id || form.section_id === 'all'
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  All Assigned Sections
                </button>
                {sections.map(s => {
                  const secCode = s.code || s.name;
                  const isSelected = form.section_id && form.section_id !== 'all' && form.section_id.includes(secCode);
                  return (
                    <button
                      key={s.id || s._id}
                      type="button"
                      onClick={() => {
                        let currentList = form.section_id && form.section_id !== 'all'
                          ? form.section_id.split(', ').filter(Boolean)
                          : [];
                        if (currentList.includes(secCode)) {
                          currentList = currentList.filter(item => item !== secCode);
                        } else {
                          currentList.push(secCode);
                        }
                        const newVal = currentList.length === 0 ? 'all' : currentList.join(', ');
                        setForm({ ...form, section_id: newVal });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {secCode}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submission Methods Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Select Permitted Submission Methods & Custom Rules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SUBMISSION_METHOD_OPTIONS.map(method => {
                const isSelected = form.selectedMethods.some(m => m.id === method.id);
                const selectedObj = form.selectedMethods.find(m => m.id === method.id);

                return (
                  <div
                    key={method.id}
                    className={`p-3 rounded-xl border transition space-y-2 ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500 text-white'
                        : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/5'
                    }`}
                  >
                    <label className="flex items-center justify-between cursor-pointer text-xs font-bold">
                      <span>{method.label}</span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMethod(method)}
                        className="accent-indigo-500 rounded"
                      />
                    </label>

                    {isSelected && (
                      <input
                        type="text"
                        value={selectedObj?.instructions || ''}
                        onChange={e => updateMethodInstructions(method.id, e.target.value)}
                        placeholder="Custom rules (e.g. max size, location, format)..."
                        className="w-full p-1.5 bg-white/10 border border-white/10 rounded text-[11px] text-white focus:outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-white/60 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full p-2 bg-[#161b22] border border-white/10 rounded-lg text-xs text-white"
              >
                <option value="published">Published (Visible to Students)</option>
                <option value="draft">Draft (Saved in Teacher Portal)</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white/70"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white transition shadow-lg disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Confirm & Publish Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
