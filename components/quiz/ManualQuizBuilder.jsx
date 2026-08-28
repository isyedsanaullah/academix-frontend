import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineSparkles } from 'react-icons/hi';

export default function ManualQuizBuilder({ quizToEdit, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);

  const [formData, setFormData] = useState({
    title: quizToEdit?.title || '',
    description: quizToEdit?.description || '',
    subject_id: quizToEdit?.subject_id || '',
    class_id: quizToEdit?.class_id || '',
    section_id: quizToEdit?.section_id || '',
    duration: quizToEdit?.duration || 30,
    startTime: quizToEdit?.startTime ? new Date(quizToEdit.startTime).toISOString().slice(0, 16) : '',
    passingPercentage: quizToEdit?.passingPercentage || 40,
    negativeMarking: quizToEdit?.negativeMarking || 0,
    shuffleQuestions: quizToEdit?.shuffleQuestions || false,
    shuffleOptions: quizToEdit?.shuffleOptions || false,
    maxAttempts: quizToEdit?.maxAttempts || 1,
    resultVisibility: quizToEdit?.resultVisibility || 'after_close',
    status: quizToEdit?.status || 'draft'
  });

  const [questions, setQuestions] = useState(quizToEdit?.questions || [
    {
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      marks: 1,
      difficulty: 'medium'
    }
  ]);

  const [dbSections, setDbSections] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, clsRes, secRes, profRes] = await Promise.all([
          api.get('/subjects').catch(() => ({ data: { data: [] } })),
          api.get('/classes').catch(() => ({ data: { data: [] } })),
          api.get('/sections').catch(() => ({ data: { data: [] } })),
          api.get('/profile').catch(() => ({ data: { data: {} } }))
        ]);

        const fetchedSubjects = subRes.data.data || [];
        const teacherProfSubs = profRes.data.data?.extra?.teacherSubjects || profRes.data.data?.teacherSubjects || [];
        setClasses(clsRes.data.data || []);
        setDbSections(secRes.data.data || []);

        // Combine backend-filtered subjects with profile assigned subjects
        const subjectsMap = new Map();
        fetchedSubjects.forEach(s => subjectsMap.set(s.id || s._id, s));
        teacherProfSubs.forEach(s => subjectsMap.set(s.id || s._id, s));

        const availableSubjects = Array.from(subjectsMap.values());
        setSubjects(availableSubjects);

        // Auto-select subject if only 1 is assigned
        if (!quizToEdit && availableSubjects.length === 1) {
          const singleSubId = availableSubjects[0].id || availableSubjects[0]._id;
          setFormData(prev => ({ ...prev, subject_id: singleSubId }));
        }
      } catch (e) {}
    };
    fetchData();
  }, []);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        marks: 1,
        difficulty: 'medium'
      }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      toast.error('Quiz must have at least 1 question');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length >= 5) {
      toast.error('Maximum 5 options allowed per MCQ');
      return;
    }
    updated[qIndex].options.push('');
    setQuestions(updated);
  };

  const removeOption = (qIndex, oIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) {
      toast.error('Minimum 2 options required');
      return;
    }
    updated[qIndex].options.splice(oIndex, 1);
    if (updated[qIndex].correctAnswer >= updated[qIndex].options.length) {
      updated[qIndex].correctAnswer = 0;
    }
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error('Please enter a quiz title');
    if (!formData.subject_id) return toast.error('Please select a subject');
    if (!formData.class_id) return toast.error('Please select a class');

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        return toast.error(`Question ${i + 1} text cannot be empty`);
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j].trim()) {
          return toast.error(`Question ${i + 1}, Option ${j + 1} cannot be empty`);
        }
      }
    }

    setLoading(true);
    try {
      // Calculate endTime automatically from startTime + duration minutes
      let calculatedEndTime = null;
      if (formData.startTime && formData.duration) {
        const startDt = new Date(formData.startTime);
        calculatedEndTime = new Date(startDt.getTime() + parseFloat(formData.duration) * 60000).toISOString();
      }

      const payload = {
        ...formData,
        endTime: calculatedEndTime,
        questions
      };

      if (quizToEdit) {
        await api.put(`/quizzes/${quizToEdit._id || quizToEdit.id}`, payload);
        toast.success('Quiz updated successfully!');
      } else {
        await api.post('/quizzes', payload);
        toast.success('Quiz created successfully in Draft state!');
      }
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HiOutlineSparkles className="text-indigo-400" />
            {quizToEdit ? 'Edit Quiz' : 'Manual Quiz Builder'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* General Config */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-white/60 mb-1">Quiz Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Physics Chapter 3 Mid-Term Quiz"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">
                Subject * {subjects.length === 1 ? '(Assigned)' : ''}
              </label>
              <select
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-3 py-2 bg-[#161b22] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Class *</label>
              <select
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full px-3 py-2 bg-[#161b22] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                required
              >
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-white/60 mb-1">Target Section(s)</label>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, section_id: 'all' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    !formData.section_id || formData.section_id === 'all'
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  All Sections
                </button>
                {(() => {
                  const sectionList = dbSections.length > 0
                    ? dbSections.map(s => s.name || s.code).filter(Boolean)
                    : ['Section A', 'Section B', 'Section C', 'Section D'];

                  return sectionList.map((secName) => {
                    const isSelected = formData.section_id && formData.section_id !== 'all' && formData.section_id.includes(secName);
                    return (
                      <button
                        key={secName}
                        type="button"
                        onClick={() => {
                          let currentList = formData.section_id && formData.section_id !== 'all'
                            ? formData.section_id.split(', ').filter(Boolean)
                            : [];
                          if (currentList.includes(secName)) {
                            currentList = currentList.filter(s => s !== secName);
                          } else {
                            currentList.push(secName);
                          }
                          const newVal = currentList.length === 0 ? 'all' : currentList.join(', ');
                          setFormData({ ...formData, section_id: newVal });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {secName}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Opening Time (Start Window)</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
              />
              <p className="text-[10px] text-white/40 mt-1">Closing time calculated automatically based on duration.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Passing %</label>
              <input
                type="number"
                value={formData.passingPercentage}
                onChange={(e) => setFormData({ ...formData, passingPercentage: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                min="0" max="100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Negative Marking (Marks per wrong)</label>
              <input
                type="number"
                step="0.25"
                value={formData.negativeMarking}
                onChange={(e) => setFormData({ ...formData, negativeMarking: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                min="0"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Max Attempts</label>
              <input
                type="number"
                value={formData.maxAttempts}
                onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Result Visibility</label>
              <select
                value={formData.resultVisibility}
                onChange={(e) => setFormData({ ...formData, resultVisibility: e.target.value })}
                className="w-full px-3 py-2 bg-[#161b22] border border-white/10 rounded-lg text-sm"
              >
                <option value="after_close">After Quiz Window Closes</option>
                <option value="immediate">Immediately After Submission</option>
                <option value="manual_release">Manual Release by Teacher</option>
              </select>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white/80">Questions ({questions.length})</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition"
              >
                <HiOutlinePlus size={14} /> Add Question
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div key={qIdx} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400">Question {qIdx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
                    className="text-white/40 hover:text-red-400 text-xs"
                  >
                    <HiOutlineTrash size={14} />
                  </button>
                </div>

                <div>
                  <textarea
                    value={q.questionText}
                    onChange={(e) => updateQuestion(qIdx, 'questionText', e.target.value)}
                    placeholder="Enter MCQ question statement..."
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    rows={2}
                    required
                  />
                </div>

                {/* Options */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-white/40 uppercase">Options (Select correct radio button)</label>
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        checked={q.correctAnswer === oIdx}
                        onChange={() => updateQuestion(qIdx, 'correctAnswer', oIdx)}
                        className="accent-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                        placeholder={`Option ${oIdx + 1}`}
                        className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm"
                        required
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(qIdx, oIdx)}
                          className="text-white/30 hover:text-red-400 text-xs p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {q.options.length < 5 && (
                    <button
                      type="button"
                      onClick={() => addOption(qIdx)}
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-white/40 uppercase mb-1">Marks</label>
                    <input
                      type="number"
                      value={q.marks}
                      onChange={(e) => updateQuestion(qIdx, 'marks', e.target.value)}
                      className="w-full px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs"
                      min="0.5" step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-white/40 uppercase mb-1">Explanation (Optional)</label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                      placeholder="Why is this answer correct?"
                      className="w-full px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Bottom Add Question Button */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={addQuestion}
                className="w-full py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <HiOutlinePlus size={16} /> Add Another Question
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Draft Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
