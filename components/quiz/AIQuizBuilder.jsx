import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineSparkles, HiOutlineBookOpen, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi';

export default function AIQuizBuilder({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Select Config, 2: Generating Progress, 3: Preview & Review
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    subjectName: '',
    class_id: '',
    chapters: [],
    topics: [],
    difficulty: 'medium',
    count: 5,
    duration: 30
  });

  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const [dbSections, setDbSections] = useState([]);

  useEffect(() => {
    const fetchMetadata = async () => {
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

        const subjectsMap = new Map();
        fetchedSubjects.forEach(s => subjectsMap.set(s.id || s._id, s));
        teacherProfSubs.forEach(s => subjectsMap.set(s.id || s._id, s));

        const availableSubjects = Array.from(subjectsMap.values());
        setSubjects(availableSubjects);

        if (availableSubjects.length === 1) {
          const singleSubId = availableSubjects[0].id || availableSubjects[0]._id;
          handleSubjectChange(singleSubId);
        }
      } catch (e) {}
    };
    fetchMetadata();
  }, []);

  const handleSubjectChange = async (subjectId) => {
    const selectedSub = subjects.find(s => s.id === subjectId || s._id === subjectId);
    const subName = selectedSub ? selectedSub.name : subjectId;
    setFormData(prev => ({ ...prev, subject_id: subjectId, subjectName: subName, chapters: [], topics: [] }));

    setLoadingHierarchy(true);
    try {
      const { data } = await api.get(`/pdf/hierarchy?subject=${encodeURIComponent(subName)}`);
      setHierarchy(data.data || []);
    } catch (e) {
      setHierarchy([]);
    } finally {
      setLoadingHierarchy(false);
    }
  };

  const toggleChapter = (chapTitle) => {
    setFormData(prev => {
      const exists = prev.chapters.includes(chapTitle);
      const newChaps = exists ? prev.chapters.filter(c => c !== chapTitle) : [...prev.chapters, chapTitle];
      return { ...prev, chapters: newChaps };
    });
  };

  const toggleTopic = (topicName) => {
    setFormData(prev => {
      const exists = prev.topics.includes(topicName);
      const newTopics = exists ? prev.topics.filter(t => t !== topicName) : [...prev.topics, topicName];
      return { ...prev, topics: newTopics };
    });
  };

  const handleStartGeneration = async (e) => {
    e.preventDefault();
    if (!formData.subject_id) return toast.error('Please select a subject');
    if (!formData.class_id) return toast.error('Please select a class');

    setStep(2);
    try {
      const { data } = await api.post('/quizzes/ai-generate-job', formData);
      setJobId(data.data.jobId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start AI generation');
      setStep(1);
    }
  };

  // Poll Job Status every 2 seconds
  useEffect(() => {
    if (step !== 2 || !jobId) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/quizzes/jobs/${jobId}`);
        const job = data.data;
        setJobStatus(job);

        if (job.status === 'completed') {
          clearInterval(interval);
          setGeneratedQuiz(job.data);
          setStep(3);
          toast.success('AI Quiz generation completed! Review questions below.');
        } else if (job.status === 'failed') {
          clearInterval(interval);
          toast.error(`Generation failed: ${job.error || 'Unknown error'}`);
          setStep(1);
        }
      } catch (e) {}
    }, 2000);

    return () => clearInterval(interval);
  }, [step, jobId]);

  const handlePublishQuiz = async () => {
    if (!generatedQuiz) return;
    setPublishing(true);
    try {
      await api.post(`/quizzes/${generatedQuiz.id || generatedQuiz._id}/publish`);
      toast.success('Quiz published successfully! Students can now access it.');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish quiz');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HiOutlineSparkles className="text-indigo-400" />
            AI Quiz Generator (Topic-Based)
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        {/* STEP 1: Configuration */}
        {step === 1 && (
          <form onSubmit={handleStartGeneration} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1">Subject *</label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => handleSubjectChange(e.target.value)}
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

              <div className="md:col-span-2">
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
                <label className="block text-xs font-semibold text-white/60 mb-1">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 bg-[#161b22] border border-white/10 rounded-lg text-sm"
                >
                  <option value="easy">Easy (Definitions & Recall)</option>
                  <option value="medium">Medium (Understanding & Concepts)</option>
                  <option value="hard">Hard (Analysis & Deep Reasoning)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1">Number of Questions</label>
                <input
                  type="number"
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  min="1" max="25"
                />
              </div>
            </div>

            {/* Hierarchy Chapter & Topic Selector */}
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <HiOutlineBookOpen size={16} /> Select Syllabus Chapters & Topics (From Uploaded Materials)
              </h3>

              {loadingHierarchy ? (
                <p className="text-xs text-white/40 animate-pulse">Loading study material hierarchy...</p>
              ) : hierarchy.length === 0 ? (
                <p className="text-xs text-white/40">No extracted chapters found for this subject. AI will generate using standard curriculum.</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {hierarchy.map((chap, cIdx) => (
                    <div key={cIdx} className="border-b border-white/5 pb-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white/90">
                        <input
                          type="checkbox"
                          checked={formData.chapters.includes(chap.title)}
                          onChange={() => toggleChapter(chap.title)}
                          className="accent-indigo-500 rounded"
                        />
                        <span>{chap.title}</span>
                      </label>
                      {chap.topics && chap.topics.length > 0 && (
                        <div className="ml-6 mt-1.5 flex flex-wrap gap-1.5">
                          {chap.topics.map((top, tIdx) => (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={() => toggleTopic(top)}
                              className={`px-2 py-0.5 rounded text-[11px] border transition ${
                                formData.topics.includes(top)
                                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                              }`}
                            >
                              {top}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition"
              >
                <HiOutlineSparkles /> Generate AI Quiz
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Background Job Progress */}
        {step === 2 && (
          <div className="p-12 text-center space-y-6">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Generating AI Quiz Background Job</h3>
              <p className="text-xs text-white/50">{jobStatus?.message || 'Searching question bank and vector index...'}</p>
            </div>

            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden max-w-md mx-auto">
              <div
                className="bg-indigo-500 h-full transition-all duration-500"
                style={{ width: `${jobStatus?.progress || 15}%` }}
              />
            </div>

            <p className="text-xs text-white/30">You can safely keep this open or wait a moment.</p>
          </div>
        )}

        {/* STEP 3: Preview & Teacher Review Workflow */}
        {step === 3 && generatedQuiz && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <HiOutlineCheckCircle size={18} /> Quiz Generated in Draft State
                </h3>
                <p className="text-xs text-white/60">Review questions below before publishing to students.</p>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full uppercase">
                {generatedQuiz.status}
              </span>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider">
                Generated Questions ({generatedQuiz.questions?.length || 0})
              </h4>
              {(generatedQuiz.questions || []).map((q, idx) => (
                <div key={idx} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">Q{idx + 1}. {q.questionText}</span>
                    {q.isReused && (
                      <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full">Reused from Question Bank</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {q.options?.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`px-3 py-1.5 rounded-lg text-xs border ${
                          oIdx === q.correctAnswer
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold'
                            : 'bg-white/5 border-white/5 text-white/60'
                        }`}
                      >
                        {opt} {oIdx === q.correctAnswer && '✓'}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-white/40 italic pt-1">💡 {q.explanation}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium"
              >
                Keep as Draft & Close
              </button>
              <button
                type="button"
                onClick={handlePublishQuiz}
                disabled={publishing}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : 'Approve & Publish Quiz'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
