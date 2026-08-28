import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSparkles, HiOutlineChartBar, HiOutlineBookOpen, HiOutlineCheckCircle, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';
import ManualQuizBuilder from '@/components/quiz/ManualQuizBuilder';
import AIQuizBuilder from '@/components/quiz/AIQuizBuilder';
import TeacherQuizAnalytics from '@/components/quiz/TeacherQuizAnalytics';
import QuestionBankView from '@/components/quiz/QuestionBankView';

const Quizzes = () => {
  const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes' | 'question-bank'
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showManualModal, setShowManualModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState(null);
  const [analyticsQuizId, setAnalyticsQuizId] = useState(null);

  const fetchQuizzes = async () => {
    try {
      const { data } = await api.get('/quizzes');
      setQuizzes(data.data || []);
    } catch {
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handlePublish = async (quizId) => {
    try {
      await api.post(`/quizzes/${quizId}/publish`);
      toast.success('Quiz published successfully!');
      fetchQuizzes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish quiz');
    }
  };

  const handleDelete = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await api.delete(`/quizzes/${quizId}`);
      toast.success('Quiz deleted');
      fetchQuizzes();
    } catch (err) {
      toast.error('Failed to delete quiz');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Quiz & Assessment Management</h1>
          <p className="text-xs text-white/50">Manage manual/AI quizzes, question bank, and student performance analytics</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setQuizToEdit(null); setShowManualModal(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition"
          >
            <HiOutlinePlus size={16} /> Create Manual Quiz
          </button>
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-lg"
          >
            <HiOutlineSparkles size={16} /> Generate AI Quiz
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'quizzes' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
          }`}
        >
          All Quizzes ({quizzes.length})
        </button>
        <button
          onClick={() => setActiveTab('question-bank')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'question-bank' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
          }`}
        >
          <HiOutlineBookOpen size={14} /> Central Question Bank
        </button>
      </div>

      {/* TAB 1: Quizzes Table */}
      {activeTab === 'quizzes' && (
        <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Questions</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map(q => (
                <tr key={q._id || q.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-white/90">
                    {q.title}
                    {q.isAIGenerated && (
                      <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">AI</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/50">{q.class_id || '-'}</td>
                  <td className="px-4 py-3 text-white/50">{q.questions?.length || 0}</td>
                  <td className="px-4 py-3 text-white/50">{q.duration} min</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      q.status === 'published' || q.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                      q.status === 'draft' ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-white/40'
                    }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {q.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(q._id || q.id)}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded transition flex items-center gap-1"
                        >
                          <HiOutlineCheckCircle size={14} /> Publish
                        </button>
                      )}
                      <button
                        onClick={() => setAnalyticsQuizId(q._id || q.id)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-indigo-400 rounded transition"
                        title="View Analytics"
                      >
                        <HiOutlineChartBar size={16} />
                      </button>
                      <button
                        onClick={() => { setQuizToEdit(q); setShowManualModal(true); }}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded transition"
                        title="Edit Quiz"
                      >
                        <HiOutlinePencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(q._id || q.id)}
                        className="p-1.5 bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 rounded transition"
                        title="Delete Quiz"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {quizzes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/30 text-xs">No quizzes created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Question Bank View */}
      {activeTab === 'question-bank' && <QuestionBankView />}

      {/* Modals */}
      {showManualModal && (
        <ManualQuizBuilder
          quizToEdit={quizToEdit}
          onClose={() => { setShowManualModal(false); setQuizToEdit(null); }}
          onSuccess={fetchQuizzes}
        />
      )}

      {showAIModal && (
        <AIQuizBuilder
          onClose={() => setShowAIModal(false)}
          onSuccess={fetchQuizzes}
        />
      )}

      {analyticsQuizId && (
        <TeacherQuizAnalytics
          quizId={analyticsQuizId}
          onClose={() => setAnalyticsQuizId(null)}
        />
      )}
    </div>
  );
};

export default Quizzes;
