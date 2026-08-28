import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCheck } from 'react-icons/hi';

export default function AssignmentSectionEditor({
  sectionKey,
  assignmentData,
  onSave,
  onClose
}) {
  const [formData, setFormData] = useState({ ...assignmentData });

  const handleSave = (e) => {
    e.preventDefault();
    onSave(formData);
    toast.success('Section updated successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h3 className="text-base font-bold text-indigo-400 capitalize">
            Edit Section: {sectionKey}
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Metadata Section */}
          {sectionKey === 'header' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-white/60 mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-white/60 mb-1">Assignment Number</label>
                <input
                  type="text"
                  value={formData.assignmentNumber || ''}
                  onChange={e => setFormData({ ...formData, assignmentNumber: e.target.value })}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-white/60 mb-1">Total Marks</label>
                <input
                  type="number"
                  value={formData.totalMarks || 20}
                  onChange={e => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-white/60 mb-1">Estimated Completion Time</label>
                <input
                  type="text"
                  value={formData.estimatedTime || ''}
                  onChange={e => setFormData({ ...formData, estimatedTime: e.target.value })}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-white/60 mb-1">Submission Deadline</label>
                <input
                  type="text"
                  value={formData.dueDate || ''}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* Objectives Section */}
          {sectionKey === 'objectives' && (
            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-white/60">Learning Objectives (One per line)</label>
              <textarea
                value={(formData.objectives || []).join('\n')}
                onChange={e => setFormData({ ...formData, objectives: e.target.value.split('\n').filter(Boolean) })}
                rows={6}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                placeholder="Enter objective 1&#10;Enter objective 2"
              />
            </div>
          )}

          {/* Instructions Section */}
          {sectionKey === 'instructions' && (
            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-white/60">General Instructions (One per line)</label>
              <textarea
                value={(formData.instructions || []).join('\n')}
                onChange={e => setFormData({ ...formData, instructions: e.target.value.split('\n').filter(Boolean) })}
                rows={6}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
              />
            </div>
          )}

          {/* Questions Section */}
          {sectionKey === 'questions' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white/80">Questions ({formData.questions?.length || 0})</span>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    questions: [...(formData.questions || []), { title: 'New Question Task', description: '', marks: 5 }]
                  })}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <HiOutlinePlus size={14} /> Add Question
                </button>
              </div>

              {(formData.questions || []).map((q, idx) => (
                <div key={idx} className="bg-white/[0.03] border border-white/10 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400">Q{idx + 1}.</span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        questions: formData.questions.filter((_, i) => i !== idx)
                      })}
                      className="text-white/40 hover:text-red-400"
                    >
                      <HiOutlineTrash size={14} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 mb-1 uppercase">Question Title</label>
                    <input
                      type="text"
                      value={q.title || ''}
                      onChange={e => {
                        const updated = [...formData.questions];
                        updated[idx].title = e.target.value;
                        setFormData({ ...formData, questions: updated });
                      }}
                      className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 mb-1 uppercase">Description / Details</label>
                    <textarea
                      value={q.description || ''}
                      onChange={e => {
                        const updated = [...formData.questions];
                        updated[idx].description = e.target.value;
                        setFormData({ ...formData, questions: updated });
                      }}
                      rows={2}
                      className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-white/50 mb-1 uppercase">Marks</label>
                      <input
                        type="number"
                        value={q.marks || 5}
                        onChange={e => {
                          const updated = [...formData.questions];
                          updated[idx].marks = parseInt(e.target.value);
                          setFormData({ ...formData, questions: updated });
                        }}
                        className="w-full p-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rubric Section */}
          {sectionKey === 'rubric' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white/80">Grading Rubric Criteria</span>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    rubric: [...(formData.rubric || []), { criterion: 'New Criterion', maxMarks: 5, exemplary: 'Exemplary performance', proficient: 'Good performance', developing: 'Needs improvement' }]
                  })}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <HiOutlinePlus size={14} /> Add Criterion
                </button>
              </div>

              {(formData.rubric || []).map((r, idx) => (
                <div key={idx} className="bg-white/[0.03] border border-white/10 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={r.criterion || ''}
                      onChange={e => {
                        const updated = [...formData.rubric];
                        updated[idx].criterion = e.target.value;
                        setFormData({ ...formData, rubric: updated });
                      }}
                      placeholder="Criterion Name"
                      className="p-1.5 bg-white/5 border border-white/10 rounded-lg font-bold text-indigo-300 text-xs flex-1 mr-3"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        rubric: formData.rubric.filter((_, i) => i !== idx)
                      })}
                      className="text-white/40 hover:text-red-400"
                    >
                      <HiOutlineTrash size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1">Exemplary</label>
                      <input
                        type="text"
                        value={r.exemplary || ''}
                        onChange={e => {
                          const updated = [...formData.rubric];
                          updated[idx].exemplary = e.target.value;
                          setFormData({ ...formData, rubric: updated });
                        }}
                        className="w-full p-1.5 bg-white/5 border border-white/10 rounded text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1">Proficient</label>
                      <input
                        type="text"
                        value={r.proficient || ''}
                        onChange={e => {
                          const updated = [...formData.rubric];
                          updated[idx].proficient = e.target.value;
                          setFormData({ ...formData, rubric: updated });
                        }}
                        className="w-full p-1.5 bg-white/5 border border-white/10 rounded text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1">Developing</label>
                      <input
                        type="text"
                        value={r.developing || ''}
                        onChange={e => {
                          const updated = [...formData.rubric];
                          updated[idx].developing = e.target.value;
                          setFormData({ ...formData, rubric: updated });
                        }}
                        className="w-full p-1.5 bg-white/5 border border-white/10 rounded text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Actions */}
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-lg"
            >
              <HiOutlineCheck size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
